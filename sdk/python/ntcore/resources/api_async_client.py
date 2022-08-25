from .api_client import ApiClient
from ..exceptions.exceptions import NTCoreAPIException
from requests_futures.sessions import FuturesSession
from requests_toolbelt.adapters.ssl import SSLAdapter
try:
    from urllib.parse import urljoin
except ImportError:
    from urlparse import urljoin  # Python 2


class ApiAsyncClient(ApiClient):
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

    def __init__(self, username, password, server, encryptionData=None, api_token=None):
        '''
        Create an instance of the API async client.
        This client is used to make the calls to the NTCore API.
        '''
        super(ApiAsyncClient, self).__init__(username, password, server, encryptionData=encryptionData, api_token=api_token)

        defaultSession = FuturesSession()
        defaultSession.mount(self.server, SSLAdapter())
        defaultSession.auth = (self.username, self.password)
        defaultSession.headers = self.baseHeaders
        self.session = defaultSession

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
            return self.session.request(
                method=method,
                url=urljoin(self.baseUrl, url),
                json=self._getRequestData(data),
                headers=headers,
                params=params,
                files=files
            )
        except Exception as e:
            # The request failed to connect
            raise NTCoreAPIException({
                'errors': [{
                    'code': 'INTERNAL_ERROR',
                    'message': 'Unable to send request: {}'.format(e.args[0])
                }]
            })

    def doPost(self, partialUrl, data, files=None, headers={}):
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
            files=files,
            data=data,
            headers=headers
        )