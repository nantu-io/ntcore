import os
import uuid
from ts.context import Context
from ts.metrics.metrics_store import MetricsStore
from ts.context import Context, RequestProcessor
from ts.torch_handler.base_handler import BaseHandler
from ts.torch_handler.densenet_handler import DenseNetHandler
from ts.torch_handler.image_classifier import ImageClassifier
from ts.torch_handler.image_segmenter import ImageSegmenter
from ts.torch_handler.object_detector import ObjectDetector
from ts.torch_handler.text_classifier import TextClassifier
from typing import Optional

def get_torch_handler(handler_name: Optional[str]):
    if not handler_name:
        return BaseHandler()
    elif handler_name == "base_handler":
        return BaseHandler()
    elif handler_name == "densenet_handler":
        return BaseHandler()
    elif handler_name == "image_classifier":
        return ImageClassifier()
    elif handler_name == "image_segmenter":
        return ImageSegmenter()
    elif handler_name == "object_detector":
        return ObjectDetector()
    elif handler_name == "text_classifier":
        return TextClassifier()
    else:
        return BaseHandler()

def build_context(model_name, model_dir, model_file):
    manifest = {
        "model": {
            "serializedFile": model_file
        }
    }
    context = Context(model_name, model_dir, manifest, None, None, None)
    context.request_processor = [RequestProcessor({})]
    context.metrics = MetricsStore(uuid.uuid4(), model_name)
    return context