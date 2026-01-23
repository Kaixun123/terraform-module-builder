import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../stores/projectStore';
import { generateTerraformProject, getFileTree, getFileByPath } from '../../generators';

// File icon based on file name
function getFileIcon(fileName: string): string {
  if (fileName.endsWith('.tf')) return '📄';
  if (fileName.endsWith('.tfvars')) return '⚙️';
  return '📁';
}

// Get display name for file
function getDisplayName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

// Group files by directory
function groupFilesByDirectory(files: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const file of files) {
    const parts = file.split('/');
    if (parts.length === 1) {
      // Root file
      if (!groups['root']) groups['root'] = [];
      groups['root'].push(file);
    } else {
      // Module file
      const moduleName = parts.slice(0, -1).join('/');
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(file);
    }
  }

  return groups;
}

export default function CodePreview() {
  const { project } = useProjectStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Generate Terraform project
  const generatedProject = useMemo(() => {
    return generateTerraformProject(project);
  }, [project]);

  // Get file tree
  const fileTree = useMemo(() => {
    return getFileTree(generatedProject);
  }, [generatedProject]);

  // Group files
  const groupedFiles = useMemo(() => {
    return groupFilesByDirectory(fileTree);
  }, [fileTree]);

  // Get selected file content
  const selectedFileContent = useMemo(() => {
    if (!selectedFile) {
      // Default to first file
      if (fileTree.length > 0) {
        const file = getFileByPath(generatedProject, fileTree[0]);
        return file?.content || '';
      }
      return '';
    }
    const file = getFileByPath(generatedProject, selectedFile);
    return file?.content || '';
  }, [selectedFile, generatedProject, fileTree]);

  // Set default selected file
  const activeFile = selectedFile || (fileTree.length > 0 ? fileTree[0] : null);

  if (fileTree.length === 0) {
    return (
      <div className="h-full bg-gray-800 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
          <span className="text-sm text-gray-400">Code Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">
            Select a template or services to generate Terraform code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 flex">
      {/* File Tree Sidebar */}
      <div className="w-48 border-r border-gray-700 overflow-y-auto flex-shrink-0">
        <div className="p-2">
          {Object.entries(groupedFiles).map(([group, files]) => (
            <div key={group} className="mb-2">
              {group !== 'root' && (
                <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                  {group.replace('modules/', '')}
                </div>
              )}
              {files.map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => setSelectedFile(filePath)}
                  className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-1 ${
                    activeFile === filePath
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{getFileIcon(filePath)}</span>
                  <span className="truncate">{getDisplayName(filePath)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File tabs */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-700 bg-gray-850 overflow-x-auto">
          {fileTree.slice(0, 6).map((filePath) => (
            <button
              key={filePath}
              onClick={() => setSelectedFile(filePath)}
              className={`px-3 py-1 text-xs rounded-t flex items-center gap-1 whitespace-nowrap ${
                activeFile === filePath
                  ? 'bg-gray-700 text-white border-t border-l border-r border-gray-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {getDisplayName(filePath)}
            </button>
          ))}
          {fileTree.length > 6 && (
            <span className="px-2 text-xs text-gray-500">
              +{fileTree.length - 6} more
            </span>
          )}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="hcl"
            theme="vs-dark"
            value={selectedFileContent}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'line',
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
