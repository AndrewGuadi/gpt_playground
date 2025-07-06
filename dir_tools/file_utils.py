import os
import json
from typing import Any, Optional

class FileUtils:
    @staticmethod
    def read_file(path: str) -> Optional[str]:
        """Read and return the content of a file as a string."""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"File not found: {path}")
            return None
        except Exception as e:
            print(f"Error reading file {path}: {e}")
            return None

    @staticmethod
    def write_file(path: str, content: str) -> bool:
        """Write a string to a file, overwrite if exists."""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error writing file {path}: {e}")
            return False

    @staticmethod
    def read_json(path: str) -> Optional[Any]:
        """Read JSON data from a file and return as Python object."""
        content = FileUtils.read_file(path)
        if content is None:
            return None
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in {path}: {e}")
            return None

    @staticmethod
    def write_json(path: str, data: Any, indent: int = 2) -> bool:
        """Write Python object as pretty JSON to a file."""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=indent)
            return True
        except Exception as e:
            print(f"Error writing JSON file {path}: {e}")
            return False

    @staticmethod
    def find_files(directory: str, extension: Optional[str] = None) -> list[str]:
        """Recursively find all files in directory optionally filtered by extension."""
        matches = []
        for root, _, files in os.walk(directory):
            for file in files:
                if extension is None or file.endswith(extension):
                    matches.append(os.path.join(root, file))
        return matches

    @staticmethod
    def change_file(path: str, transform_func) -> bool:
        """
        Read a file, transform its content using transform_func(str) -> str,
        then overwrite the file with transformed content.
        """
        content = FileUtils.read_file(path)
        if content is None:
            return False
        try:
            new_content = transform_func(content)
            return FileUtils.write_file(path, new_content)
        except Exception as e:
            print(f"Error transforming file {path}: {e}")
            return False

            
    @staticmethod
    def read_all_documents(folder_path: str, allowed_extensions=None) -> str:
        """
        Recursively read all documents in a folder (and subfolders).
        Returns a single string, with each file's path and contents.
        Optionally restricts to certain file extensions (e.g., ['.txt', '.md', '.json']).
        """
        docs = []
        if allowed_extensions is not None:
            allowed_extensions = [ext.lower() for ext in allowed_extensions]
        for root, _, files in os.walk(folder_path):
            for fname in files:
                ext = os.path.splitext(fname)[1].lower()
                # Skip system files and filter extensions if specified
                if fname.startswith('.') or (allowed_extensions and ext not in allowed_extensions):
                    continue
                fpath = os.path.join(root, fname)
                content = FileUtils.read_file(fpath)
                if content is not None:
                    docs.append(f"---\n[File: {fpath}]\n{content}\n")
        return "\n".join(docs)


    @staticmethod
    def get_basedirectory():
        CURRENT_DIR = os.path.dirname(__file__)
        BASE_DIR = os.path.dirname(CURRENT_DIR)
        return BASE_DIR