# Resize the three images to 2000 x 1250 pixels

from PIL import Image

# File paths
input_paths = [
    "metadata/switch-tenants-1.png",
    "metadata/view-logs-1.png",
]

output_paths = [
    "metadata/switch-tenants-1-2000x1250.png",
    "metadata/view-logs-1-2000x1250.png",
]

# Resize and save
for input_path, output_path in zip(input_paths, output_paths):
    img = Image.open(input_path)
    resized_img = img.resize((2000, 1250), Image.LANCZOS)
    resized_img.save(output_path)

output_paths
