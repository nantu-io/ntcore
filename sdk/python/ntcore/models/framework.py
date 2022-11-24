from enum import Enum

class Framework(Enum):
    """
    Define the types of acceptable frameworks
    """
    # Scikit-learn
    sklearn = "sklearn"

    # Tensorflow
    tensorflow = "tensorflow"

    # Pytorch
    pytorch = "pytorch"
    
    # Unknown
    unknown = "unknown"