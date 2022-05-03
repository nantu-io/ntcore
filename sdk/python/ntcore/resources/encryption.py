#!/usr/bin/env python

import os
import json
import requests
import time
import sys

from jwcrypto import jwk, jws as cryptoJWS, jwe
from jwcrypto.common import json_encode, json_decode
from jwcrypto.common import base64url_decode, base64url_encode
from jose import jws

from ..exceptions.exceptions import NTCoreAPIException
from six.moves.urllib.parse import urlparse


class Encryption(object):
    '''
    The NTCore API Encryption Client.

    :param clientPrivateKeySetLocation:
        The location(url or path to file) of client's private JWK key set. **REQUIRED**
    :param keySetLocation:
        The location(url or path to file) of ntcore public JWK key set. **REQUIRED**
    :param encryptionAlgorithm:
        JWE encryption algorithm.
    :param signAlgorithm:
        JWS signature algorithm.
    :param encryptionMethod:
        JWE body encryption method.
    :param jwsExpirationMinutes:
        Time in minutes when JWS signature is valid after creation.
    '''

    def __init__(self,
                 clientPrivateKeySetLocation,
                 keySetLocation,
                 encryptionAlgorithm='RSA-OAEP-256',
                 signAlgorithm='RS256',
                 encryptionMethod='A256CBC-HS512',
                 jwsExpirationMinutes=5):
        '''
        Encryption service for ntcore client
        '''

        self.clientPrivateKeySetLocation = clientPrivateKeySetLocation
        self.keySetLocation = keySetLocation
        self.encryptionAlgorithm = encryptionAlgorithm
        self.signAlgorithm = signAlgorithm
        self.encryptionMethod = encryptionMethod
        self.jwsExpirationMinutes = jwsExpirationMinutes
        self.integer_types = (int, long,) if sys.version_info < (3,) else (int,)

    def encrypt(self, body):
        '''
        :param body:
            Body message to be 1) signed and 2) encrypted. **REQUIRED**
        :returns:
            String as a result of signature and encryption of input message body
        '''

        jwsKeySet = self.__getJwkKeySet(location=self.clientPrivateKeySetLocation)
        jwkSignKey = self.__findJwkKeyByAlgorithm(jwkKeySet=jwsKeySet, algorithm=self.signAlgorithm)
        privateKeyToSign = jwk.JWK(**jwkSignKey)
        jwsToken = cryptoJWS.JWS(body.encode('utf-8'))
        jwsToken.add_signature(privateKeyToSign, None, json_encode({
            "alg": self.signAlgorithm,
            "kid": jwkSignKey['kid'],
            "exp": self.__getJwsExpirationTime()
        }))
        signedBody = jwsToken.serialize(True)

        jweKeySet = self.__getJwkKeySet(location=self.keySetLocation)
        jwkEncryptKey = self.__findJwkKeyByAlgorithm(jwkKeySet=jweKeySet, algorithm=self.encryptionAlgorithm)
        publicKeyToEncrypt = jwk.JWK(**jwkEncryptKey)
        protected_header = {
            "alg": self.encryptionAlgorithm,
            "enc": self.encryptionMethod,
            "typ": "JWE",
            "kid": jwkEncryptKey['kid'],
        }
        jweToken = jwe.JWE(signedBody.encode('utf-8'), recipient=publicKeyToEncrypt, protected=protected_header)
        return jweToken.serialize(True)

    def decrypt(self, body):
        '''
        :param body:
            Body message to be 1) decrypted and 2) check for correct signature. **REQUIRED**
        :returns:
            Decrypted body message
        '''

        jweKeySet = self.__getJwkKeySet(location=self.clientPrivateKeySetLocation)
        jwkDecryptKey = self.__findJwkKeyByAlgorithm(jwkKeySet=jweKeySet, algorithm=self.encryptionAlgorithm)
        privateKeyToDecrypt = jwk.JWK(**jwkDecryptKey)
        jweToken = jwe.JWE()
        try:
            jweToken.deserialize(body, key=privateKeyToDecrypt)
        except Exception as e:
            raise NTCoreAPIException(str(e))
        payload = jweToken.payload

        self.checkJwsExpiration(payload)
        jwsKeySet = self.__getJwkKeySet(location=self.keySetLocation)
        jwkCheckSignKey = self.__findJwkKeyByAlgorithm(jwkKeySet=jwsKeySet, algorithm=self.signAlgorithm)
        try:
            return jws.verify(payload, json.dumps(jwkCheckSignKey), algorithms=self.signAlgorithm)
        except Exception as e:
            raise NTCoreAPIException(str(e))

    def __getJwkKeySet(self, location):
        '''
        Retrieves JWK key data from given location.

        :param location:
            Location(can be a URL or path to file) of JWK key data. **REQUIRED**
        :returns:
            JWK key set found at given location.
        '''
        try:
            url = urlparse(location)
            if url.scheme and url.netloc and url.path:
                return requests.get(location).text
            raise NTCoreAPIException('Failed to parse url from string = ' + location)
        except Exception as e:
            if os.path.isfile(location):
                with open(location) as f:
                    return f.read()
            else:
                raise NTCoreAPIException('Wrong JWK key set location path = ' + location)

    def __findJwkKeyByAlgorithm(self, jwkKeySet, algorithm):
        '''
        Finds JWK key by given algorithm.

        :param jwkKeySet:
            JSON representation of JWK key set. **REQUIRED**
        :param algorithm:
            Algorithm of the JWK key to be found in key set. **REQUIRED**
        :returns:
            JWK key with given algorithm.
        '''

        try:
            keySet = json.loads(jwkKeySet)
        except ValueError:
            raise NTCoreAPIException('Wrong JWK key set ' + jwkKeySet)

        for key in keySet['keys']:
            if key['alg'] == algorithm:
                return key

        raise NTCoreAPIException('JWK set doesn\'t contain key with algorithm = ' + algorithm)

    def __getJwsExpirationTime(self):
        '''
        Calculates the expiration time (in seconds) of JWS signature.

        :returns:
            JWS expiration time in seconds since the UNIX epoch (January 1, 1970 00:00:00 UTC).
        '''

        secondsInMinute = 60
        return int(time.time() + self.jwsExpirationMinutes * secondsInMinute)

    def checkJwsExpiration(self, payload):
        '''
        Check if JWS signature has not expired.
        '''

        header = jws.get_unverified_header(payload)

        if 'exp' not in header:
            raise NTCoreAPIException('While trying to verify JWS signature no [exp] header is found')

        exp = header['exp']

        if not isinstance(exp, self.integer_types):
            raise NTCoreAPIException('Wrong value in [exp] header of JWS signature, must be integer')

        if exp < time.time():
            raise NTCoreAPIException('JWS signature has expired, checked by [exp] JWS header')