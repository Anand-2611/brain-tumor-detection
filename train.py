import tensorflow as tf
import cv2
import os
import numpy as np

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D
from tensorflow.keras.layers import MaxPooling2D
from tensorflow.keras.layers import Flatten
from tensorflow.keras.layers import Dense


# Empty arrays
data = []
labels = []

# Dataset path
path = "dataset"

# Read images
for category in ["yes", "no"]:

    folder = os.path.join(path, category)

    label = 1 if category == "yes" else 0

    for img in os.listdir(folder):

        img_path = os.path.join(folder, img)

        image = cv2.imread(img_path)

        if image is None:
            continue

        image = cv2.resize(image, (128,128))

        data.append(image)

        labels.append(label)

print(len(data))
print(len(labels))
# Convert into arrays
y = np.array(labels)

X = np.array(data, dtype="float32")
X = X / 255.0

print(type(X))
print(X.shape)

y = np.array(labels)

print(X.shape)
print(y.shape)

# Create CNN model
model = Sequential()

# First CNN layer
model.add(
    Conv2D(
        32,
        (3,3),
        activation='relu',
        input_shape=(128,128,3)
    )
)

# Pooling layer
model.add(MaxPooling2D())

# Second CNN layer
model.add(
    Conv2D(
        64,
        (3,3),
        activation='relu'
    )
)

# Pooling again
model.add(MaxPooling2D())

# Flatten layer
model.add(Flatten())

# Dense layer
model.add(Dense(128, activation='relu'))

# Output layer
model.add(Dense(1, activation='sigmoid'))

# Compile model
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Train model
model.fit(
    X,
    y,
    epochs=10,
    batch_size=32
)

# Save model
model.save("brain_tumor_model.h5")

