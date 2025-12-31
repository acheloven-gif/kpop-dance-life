import os
import glob

def clean_and_rename_images():
    """
    Remove original images and rename normalized images to remove '_normalized' suffix
    """
    base_dir = r"C:\Users\2ой пользователь\kpop 1.3\clothes\base"
    
    # Find all normalized images
    normalized_files = glob.glob(os.path.join(base_dir, "*_normalized.png"))
    
    if not normalized_files:
        print("No normalized images found to rename.")
        return
    
    for normalized_file in normalized_files:
        # Create the new filename without '_normalized'
        new_filename = normalized_file.replace('_normalized.png', '.png')
        
        # Rename the normalized file to remove the suffix
        os.rename(normalized_file, new_filename)
        print(f"Renamed: {os.path.basename(normalized_file)} -> {os.path.basename(new_filename)}")
    
    # Now remove the original JPEG files
    original_extensions = ['.jpeg', '.jpg']
    for ext in original_extensions:
        original_files = glob.glob(os.path.join(base_dir, f"*{ext}"))
        for orig_file in original_files:
            os.remove(orig_file)
            print(f"Deleted: {os.path.basename(orig_file)}")
    
    print("Cleanup and renaming completed!")

if __name__ == "__main__":
    clean_and_rename_images()