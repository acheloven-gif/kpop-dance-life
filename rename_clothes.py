import os

def rename_files_remove_normalized(directory):
    """
    Remove '_normalized' from file names in the specified directory.
    """
    for filename in os.listdir(directory):
        if '_normalized' in filename:
            old_path = os.path.join(directory, filename)
            
            # Create new filename by removing '_normalized'
            new_filename = filename.replace('_normalized', '')
            new_path = os.path.join(directory, new_filename)
            
            # Rename the file
            os.rename(old_path, new_path)
            print(f"Renamed: {filename} -> {new_filename}")

def main():
    base_path = r"C:\Users\2ой пользователь\kpop 2 — копия (3)"
    
    # Subdirectories to process in clothes
    subdirectories = ["accessory", "bot", "shoe", "top"]
    
    for subdir in subdirectories:
        directory = os.path.join(base_path, "clothes", subdir)
        
        if os.path.exists(directory):
            print(f"\nProcessing directory: {directory}")
            rename_files_remove_normalized(directory)
        else:
            print(f"\nDirectory does not exist: {directory}")
    
    print("\nRenaming completed for all subdirectories in clothes.")

if __name__ == "__main__":
    main()