import os
import unittest
from setuptools import find_packages, setup

HERE = os.path.abspath(os.path.dirname(__file__))

def ntcore_test_suite_python():
    """
    test suite setup for ntcore python client
    """
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover("./ntcore/tests",pattern="test_*.py")
    return test_suite

about = {}
with open(os.path.join(HERE, "ntcore", "__about__.py"), "r") as f:
    exec(f.read(), about)

with open("README.md", "r") as f:
    readme = f.read()
<<<<<<< HEAD

setup(
    name=about["__title__"],
    version=about["__version__"],
    maintainer=about["__maintainer__"],
    maintainer_email=about["__maintainer_email__"],
    description=about["__description__"],
    long_description=readme,
    long_description_content_type="text/markdown",
    license=about["__license__"],
    url=about["__url__"],
    packages=find_packages(),
    python_requires=">=2.7, !=3.0.*, !=3.1.*, !=3.2.*, !=3.3.*, !=3.4.*",
    install_requires=[
        "cloudpickle",
        "requests>=2.17.3",
        "packaging",
        "importlib_metadata>=3.7.0,!=4.7.0",
        "numpy",
        "pandas",
        "gorilla",
        "jwcrypto",
        "six",
        "python-jose",
        "requests_toolbelt"
    ],
    entry_points={
        "console_scripts": [
            
=======
if __name__ == "__main__":
    setup(
        name=about["__title__"],
        version=about["__version__"],
        maintainer=about["__maintainer__"],
        maintainer_email=about["__maintainer_email__"],
        description=about["__description__"],
        long_description=readme,
        long_description_content_type="text/markdown",
        license=about["__license__"],
        url=about["__url__"],
        packages=find_packages(),
        python_requires=">=2.7, !=3.0.*, !=3.1.*, !=3.2.*, !=3.3.*, !=3.4.*",
        install_requires=[
            "cloudpickle",
            "requests>=2.17.3",
            "packaging",
            "importlib_metadata>=3.7.0,!=4.7.0",
            "numpy",
            "pandas",
            "scikit-learn",
            "mlflow<=1.21.0"
>>>>>>> 5b48238 (feature: unit test python client)
        ],
        entry_points={
            "console_scripts": [
                
            ],
        },
        test_suite="setup.ntcore_test_suite_python",
    )
