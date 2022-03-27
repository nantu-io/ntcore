import os
import pytorch_lightning as pl
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader
from torchvision import transforms
from torchvision.datasets import MNIST

class MNISTModel(pl.LightningModule):
    def __init__(self):
        super(MNISTModel, self).__init__()
        self.l1 = torch.nn.Linear(28 * 28, 10)
        ##########################################################
        ## example_input_array is required to record model as ONNX
        ##########################################################
        # self.example_input_array = torch.randn((1, 28 * 28))

    def accuracy(self, logits, labels):
        _, predicted = torch.max(logits.data, 1)
        correct = (predicted == labels).sum().item()
        accuracy = correct / len(labels)
        return torch.tensor(accuracy)

    def forward(self, x):
        return torch.relu(self.l1(x.view(x.size(0), -1)))

    def cross_entropy_loss(self, logits, labels):
        return F.nll_loss(logits, labels)

    def training_step(self, train_batch):
        x, y = train_batch
        logits = self.forward(x)
        loss = self.cross_entropy_loss(logits, y)
        accuracy = self.accuracy(logits, y)

        self.log("loss", loss, on_epoch=True)
        self.log("accuracy", accuracy, on_epoch=True)
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=0.02)

# Initialize our model
mnist_model = MNISTModel()

# Initialize DataLoader from MNIST Dataset
train_ds = MNIST(os.getcwd(), train=True, download=True, transform=transforms.ToTensor())
train_loader = DataLoader(train_ds, batch_size=32)

# Initialize a trainer with ntcore ModelRecorder
from ntcore.integrations.torch import ModelRecorder
from ntcore.client import Client
client = Client()
experiment = client.start_run('C98MWIJEPOIXWUAQSR61Y2ANCN')
trainer = pl.Trainer(max_epochs=5, callbacks=[ModelRecorder(experiment)])

# Train the model
trainer.fit(mnist_model, train_loader)