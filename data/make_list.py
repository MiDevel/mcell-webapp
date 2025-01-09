import os

def scan_and_list_files(root_dir, output_file, extensions):
    with open(output_file, 'w') as f:
        for subdir, _, files in os.walk(root_dir):
            for file in files:
                # lowercase the file extension
                if file.lower().endswith(extensions):
                    relative_path = os.path.relpath(os.path.join(subdir, file), root_dir)
                    f.write(relative_path.replace("\\", "/") + "\n")

if __name__ == "__main__":
    root_directory = "./patterns"
    output_filename = "patterns.txt"
    file_extensions = (".mcl", ".lif", ".rle", ".l")

    scan_and_list_files(root_directory, output_filename, file_extensions)
