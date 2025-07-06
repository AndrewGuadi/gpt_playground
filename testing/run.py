from dir_tools.file_utils import FileUtils
import os


if __name__ =="__main__":
    CURRENT_DIR = os.path.dirname(__file__)
    BASE_DIR = os.path.dirname(CURRENT_DIR)
    filepath = os.path.join(BASE_DIR, 'resources', 'test-plumbing', 'project-documents')
    documents_text = FileUtils.read_all_documents(filepath)

    print(documents_text)