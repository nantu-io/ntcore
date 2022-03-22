class NTCoreAPIException(Exception):
    '''
    An Exception raised when the API response is an error.
    '''

    @property
    def message(self):
        return self.__dict__.get('message', None) or getattr(self, 'args')[0]

class HTTPException(Exception):
    '''
    An Exception raised when the API response is an error.
    '''

    @property
    def message(self):
        return self.__dict__.get('message', None) or getattr(self, 'args')[0]