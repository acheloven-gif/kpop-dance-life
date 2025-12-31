import os
import glob

def delete_original_images(directory):
    """
    Delete original images in a directory, keeping only the normalized versions.
    """
    # Find all image files in the directory
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp', '*.tiff', '*.webp']
    image_files = []
    
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(directory, ext)))
    
    deleted_count = 0
    
    for image_path in image_files:
        filename = os.path.basename(image_path)
        
        # Check if it's a normalized version
        name, ext = os.path.splitext(filename)
        if name.endswith('_normalized'):
            # This is a normalized version, keep it
            continue
        else:
            # This is an original file, check if corresponding normalized version exists
            # We need to check for any normalized version regardless of the original extension
            name, orig_ext = os.path.splitext(filename)
            # Look for normalized version with any image extension
            found_normalized = False
            for img_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']:
                normalized_name = name + '_normalized' + img_ext
                normalized_path = os.path.join(directory, normalized_name)
                if os.path.exists(normalized_path):
                    # Delete the original file since normalized version exists
                    os.remove(image_path)
                    print(f"Deleted: {image_path}")
                    deleted_count += 1
                    found_normalized = True
                    break
            
            if not found_normalized:
                # Check if there's a PNG normalized version specifically
                normalized_name = name + '_normalized.png'
                normalized_path = os.path.join(directory, normalized_name)
                
                if os.path.exists(normalized_path):
                    # Delete the original file since normalized version exists
                    os.remove(image_path)
                    print(f"Deleted: {image_path}")
                    deleted_count += 1
                else:
                    # No normalized version exists, keep the original
                    print(f"Kept (no normalized version): {image_path}")
    
    print(f"Deleted {deleted_count} original images from {directory}")
    return deleted_count

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
    
    total_deleted = 0
    
    for dir_path in directories:
        if os.path.exists(dir_path):
            print(f"\nProcessing directory: {dir_path}")
            deleted_count = delete_original_images(dir_path)
            total_deleted += deleted_count
        else:
            print(f"Directory does not exist: {dir_path}")
    
    print(f"\nTotal images deleted: {total_deleted}")

if __name__ == "__main__":
    main()