import os
from PIL import Image
import sys

def normalize_image(input_path, output_path, target_size=(512, 512)):
    """
    Normalize an image by resizing it to target dimensions while maintaining aspect ratio.
    """
    try:
        # Open and convert image to RGB (to handle RGBA, P, etc.)
        img = Image.open(input_path)
        
        # Convert to RGB if necessary (to handle RGBA, P mode images)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background for images with transparency
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
            else:
                background.paste(img)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate new dimensions maintaining aspect ratio
        img.thumbnail(target_size, Image.LANCZOS)
        
        # Create a new image with target size and paste the resized image centered
        new_img = Image.new('RGB', target_size, (255, 255, 255))
        paste_x = (target_size[0] - img.size[0]) // 2
        paste_y = (target_size[1] - img.size[1]) // 2
        new_img.paste(img, (paste_x, paste_y))
        
        # Save as PNG to preserve quality
        new_img.save(output_path, 'PNG', quality=95)
        print(f"Normalized: {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")

def normalize_images_in_directory(input_dir, output_dir=None):
    """
    Normalize all images in a directory and save to the same or output directory.
    """
    if output_dir is None:
        output_dir = input_dir
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Supported image formats
    supported_formats = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')
    
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(supported_formats):
            input_path = os.path.join(input_dir, filename)
            # Change extension to png for consistency
            name, ext = os.path.splitext(filename)
            output_filename = f"{name}_normalized.png"
            output_path = os.path.join(output_dir, output_filename)
            
            normalize_image(input_path, output_path)

def main():
    base_path = r"C:\Users\2ой пользователь\kpop 2 — копия (3)"
    
    # Directories to process
    directories = [
        os.path.join(base_path, "clothes", "accessory"),
        os.path.join(base_path, "clothes", "bot"),
        os.path.join(base_path, "clothes", "shoe"),
        os.path.join(base_path, "clothes", "top"),
        os.path.join(base_path, "avatars", "nptnorm"),
        os.path.join(base_path, "faces", "notnorm"),
        os.path.join(base_path, "gifts")
    ]
    
    for dir_path in directories:
        if os.path.exists(dir_path):
            print(f"Processing directory: {dir_path}")
            normalize_images_in_directory(dir_path)
        else:
            print(f"Directory does not exist: {dir_path}")

if __name__ == "__main__":
    main()