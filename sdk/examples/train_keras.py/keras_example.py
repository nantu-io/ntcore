import tensorflow as tf
print("TensorFlow version:", tf.__version__)

mnist = tf.keras.datasets.mnist
(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

model = tf.keras.models.Sequential([
  tf.keras.layers.Flatten(input_shape=(28, 28)),
  tf.keras.layers.Dense(128, activation='relu'),
  tf.keras.layers.Dropout(0.2),
  tf.keras.layers.Dense(10)
])
loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
model.compile(optimizer='adam', loss=loss_fn, metrics=['accuracy'])

from ntcore.client import Client
import ntcore
client = Client()
run = client.start_run('CEPYLVMD0GMSFEMMYKP8QPA9DT')
model.fit(x_train, y_train, epochs=2, experiment=run)
model.evaluate(x_test,  y_test, verbose=2, experiment=run)
client.save_model(model)
