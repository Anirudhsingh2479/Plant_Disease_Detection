import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, RandomCrop, RandomFlip, CenterCrop
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing import image as keras_image

# ---------------------------------------------------------
# 1. Setup and Paths
# ---------------------------------------------------------
data_dir = '/content/drive/MyDrive/PlantVillage_Resized_256'
batch_size = 32
original_size = (256, 256)

# ---------------------------------------------------------
# 2. Load the Raw Datasets
# ---------------------------------------------------------
print("Loading Training Data...")
train_ds_raw = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=original_size,
    batch_size=batch_size
)

print("\nLoading Validation Data...")
val_ds_raw = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=original_size,
    batch_size=batch_size
)

class_names = train_ds_raw.class_names
NUM_CLASSES = len(class_names)
print(f"\nFound {NUM_CLASSES} classes.")

# ---------------------------------------------------------
# 3. Calculate Class Weights (Handling Imbalance)
# ---------------------------------------------------------
print("\nCalculating Class Weights...")
class_weights_dict = {}
total_images = 0
class_counts = []

# Count images in each folder
for class_name in class_names:
    folder_path = os.path.join(data_dir, class_name)
    num_images = len(os.listdir(folder_path))
    class_counts.append(num_images)
    total_images += num_images

# Calculate weights: (Total Images) / (Num Classes * Images in Class)
for i, count in enumerate(class_counts):
    weight = total_images / (NUM_CLASSES * count) if count > 0 else 0
    class_weights_dict[i] = weight
    print(f" - {class_names[i]}: Weight {weight:.2f}")

# ---------------------------------------------------------
# 4. Define and Apply the Preprocessing Pipeline
# ---------------------------------------------------------
random_crop = RandomCrop(224, 224)
random_flip = RandomFlip("horizontal")
center_crop = CenterCrop(224, 224)

def process_train(image, label):
    image = random_crop(image)
    image = random_flip(image)
    image = preprocess_input(image)
    return image, label

def process_val(image, label):
    image = center_crop(image)
    image = preprocess_input(image)
    return image, label

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds_raw.map(process_train, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
val_ds = val_ds_raw.map(process_val, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)

# ---------------------------------------------------------
# 5. Build and Compile the Model
# ---------------------------------------------------------
print("\nBuilding ResNet50 Model...")
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# ---------------------------------------------------------
# 6. Train the Model (Applying the Weights!)
# ---------------------------------------------------------
print("\nStarting Training...")
# Uncomment the line below to actually run the training
# history = model.fit(train_ds, validation_data=val_ds, epochs=10, class_weight=class_weights_dict)


# ---------------------------------------------------------
# 6. Train the Model (Applying the Weights!)
# ---------------------------------------------------------
print("\nStarting Training for 15 Epochs...")
# We assign the output to 'history' so you can plot accuracy graphs later if you want
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=15,
    class_weight=class_weights_dict
)

# ---------------------------------------------------------
# 7. Save the Trained Model for Your Project
# ---------------------------------------------------------
print("\nSaving the model...")

# Saving it directly to your mounted Google Drive so it isn't deleted when Colab closes
model_save_path = '/content/drive/MyDrive/plant_disease_resnet50.keras'

# The .keras extension is the modern standard for saving Keras models
model.save(model_save_path)

print(f"Model successfully saved to: {model_save_path}")
print("You can now download this .keras file and use it in your web app or project!")


