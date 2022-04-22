def build_url(*paths):
    '''
    Returns the NTCore endpoint for sending experiment data.
    '''
    return '/'.join(s.strip('/') for s in paths)