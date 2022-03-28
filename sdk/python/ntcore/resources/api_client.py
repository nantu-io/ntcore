#!/usr/bin/env python
import json
import requests
import uuid

from .encryption import Encryption
from ..exceptions.exceptions import NTCoreAPIException
from ..__about__ import __version__
from requests_toolbelt.adapters.ssl import SSLAdapter
try:
    from urllib.parse import urljoin
except ImportError:
    from urlparse import urljoin  # Python 2


class ApiClient(object):
    '''
    The NTCore API Client.

    :param username:
        The username of this API user. **REQUIRED**
    :param password:
        The password of this API user. **REQUIRED**
    :param server:
        The base URL of the API. **REQUIRED**
    :param encryptionData:
        Array with params for encrypted requests(Fields: clientPrivateKeySetLocation, keySetLocation).
    '''

    def __init__(self, username, password, server, encryptionData=None):
        '''
        Create an instance of the API client.
        This client is used to make the calls to the NTCore API.
        '''

        # Setup encryption for request/responses.
        self.encryption = Encryption(**encryptionData) if encryptionData is not None else None

        # Base headers and the custom User-Agent to identify this client as the
        # NTCore SDK.
        self.baseHeaders = {
            'User-Agent': 'NTCore Python SDK v{}'.format(__version__),
            'x-sdk-type': 'Python',
            'x-sdk-version': __version__,
            'x-sdk-contextId': str(uuid.uuid4()),
            'Accept': 'application/jose+json' if self.encrypted else 'application/json',
            # 'Content-Type': 'application/jose+json' if self.encrypted else 'application/json'
        }

        self.username = username
        self.password = password
        self.server = server

        # The complete base URL of the API.
        self.baseUrl = urljoin(self.server, '/dsp/api/v1/')

        # The default connection to persist authentication and SSL settings.
        defaultSession = requests.Session()
        defaultSession.mount(self.server, SSLAdapter())
        defaultSession.auth = (self.username, self.password)
        defaultSession.headers = self.baseHeaders

        self.session = defaultSession

    @property
    def encrypted(self):
        return self.encryption is not None

    def _makeRequest(self,
                     method=None,
                     url=None,
                     data=None,
                     headers=None,
                     params=None,
                     files=None):
        '''
        Process an API response to ensure a JSON object is returned always.

        :param method:
            The HTTP method to use for the request. **REQUIRED**
        :param url:
            A partial URL to specify the API endpoint. **REQUIRED**
        :param data:
            A dictionary containing data for the request body.
        :param headers:
            A dictionary containing additional request headers.
        :param params:
            A dictionary containing query parameters.
        :returns:
            A JSON object containing the response data or an error object.

        .. note::
            The NTCore API supports **GET**, **POST**, **PUT** and **DELETE**.
        '''

        try:
            response = self.session.request(
                method=method,
                url=urljoin(self.baseUrl, url),
                data=self.__getRequestData(data),
                headers=headers,
                params=params,
                files=files
            )
        except Exception as e:
            # The request failed to connect
            raise NTCoreAPIException({
                'errors': [{
                    'code': 'COMMUNICATION_ERROR',
                    'message': 'Connection to {} failed: {}'.format(
                        self.server,
                        e.args[0]
                    )
                }]
            })

        if response.status_code == 204:
            return {}

        if not self.__hasJsonContentTypeInHeaders(response):
            return response.content

        content = response.content
        if hasattr(content, 'decode'):  # Python 2
            content = content.decode('utf-8')

        content = self.encryption.decrypt(content) if self.encrypted else content

        try:
            json_body = json.loads(content)
        except ValueError as e:
            # The response is not JSON
            raise NTCoreAPIException({
                'errors': [{
                    'code': 'GARBAGE_RESPONSE',
                    'message': 'Invalid response: {}'.format(e.args[0])
                }]
            })

        if 'errors' in json_body:
            # The response is a valid JSON error object
            raise NTCoreAPIException(json_body)

        return json_body

    def doGet(self, partialUrl, params={}):
        '''
        Submit a GET to the API.

        :param partialUrl:
            A partial URL to specify the API endpoint. **REQUIRED**
        :param params:
            A dictionary containing query parameters.
        :returns:
            The API response.
        '''

        return self._makeRequest(
            method='GET',
            url=partialUrl,
            params=params
        )

    def doPost(self, partialUrl, data, headers={}):
        '''
        Submit a POST to the API.

        :param partialUrl:
            A partial URL to specify the API endpoint. **REQUIRED**
        :param data:
            A dictionary containing data for the request body. **REQUIRED**
        :param headers:
            A dictionary containing additional request headers.
        :returns:
            The API response.
        '''

        return self._makeRequest(
            method='POST',
            url=partialUrl,
            data=data,
            headers=headers
        )

    def doPut(self, partialUrl, data):
        '''
        Submit a PUT to the API.

        :param partialUrl:
            A partial URL to specify the API endpoint. **REQUIRED**
        :param data:
            A dictionary containing data for the request body. **REQUIRED**
        :returns:
            The API response.
        '''

        return self._makeRequest(
            method='PUT',
            url=partialUrl,
            data=json.dumps(data).encode('utf-8')
        )

    def doDel(self, partialUrl):
        '''
        Submit a DELETE to the API.

        :param partialUrl:
            A partial URL to specify the API endpoint. **REQUIRED**
        :returns:
            The API response.
        '''

        return self._makeRequest(
            method='DELETE',
            url=partialUrl,
        )

    def __hasJsonContentTypeInHeaders(self, response):
        '''
        Check response header Content-Type.

        :param response:
            Response to be checked. **REQUIRED**
        '''

        contentType = response.headers['Content-Type']
        expectedContentType = 'application/jose+json' if self.encrypted else 'application/json'
        return response.status_code != 204 and contentType is not None and expectedContentType in contentType

    def __getRequestData(self, data):
        '''
        If encryption is enabled try to encrypt request data, otherwise no action required.

        :param data:
            Not encrypted request data. **REQUIRED**
        :returns:
            Request data, encrypted if necessary.
        '''

        return (data if data is None else self.encryption.encrypt(data)) if self.encrypted else data

    def putDocument(self, partialUrl, data, files):
        '''
        Submit a PUT to the API.

        :param partialUrl:
            A partial URL to specify the API endpoint. **REQUIRED**
        :param data:
            A dictionary containing data for the input documents. **REQUIRED**
        :param files: Dictionary of ``'filename': file-like-objects``
            for multipart encoding upload. **REQUIRED**
        :returns:
            The API response.
        '''

        return self._makeRequest(
            method='PUT',
            url=partialUrl,
            data=data,
            headers='',
            files=files
        )