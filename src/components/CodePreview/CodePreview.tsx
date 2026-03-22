import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../stores/projectStore';
import { generateTerraformProject, getFileTree, getFileByPath } from '../../generators';

function getFileIcon(fileName: string): string {
  if (fileName.endsWith('.tf')) return '◆';
  if (fileName.endsWith('.tfvars')) return '⚙';
  return '▸';
}

function getDisplayName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

function groupFilesByDirectory(files: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const file of files) {
    const parts = file.split('/');
    if (parts.length === 1) {
      if (!groups['root']) groups['root'] = [];
      groups['root'].push(file);
    } else {
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

  const generatedProject = useMemo(() => generateTerraformProject(project), [project]);
  const fileTree = useMemo(() => getFileTree(generatedProject), [generatedProject]);
  const groupedFiles = useMemo(() => groupFilesByDirectory(fileTree), [fileTree]);

  const selectedFileContent = useMemo(() => {
    const target = selectedFile || (fileTree.length > 0 ? fileTree[0] : null);
    if (!target) return '';
    return getFileByPath(generatedProject, target)?.content || '';
  }, [selectedFile, generatedProject, fileTree]);

  const activeFile = selectedFile || (fileTree.length > 0 ? fileTree[0] : null);

  if (fileTree.length === 0) {
    return (
      <div className="h-full bg-white border-t border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Code Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Select a template or services to generate Terraform code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-t border-gray-200 flex">
      {/* File tree */}
      <div className="w-44 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-2">
          {Object.entries(groupedFiles).map(([group, files]) => (
            <div key={group} className="mb-3">
              {group !== 'root' && (
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 py-1">
                  {group.replace('modules/', '')}
                </div>
              )}
              {files.map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => setSelectedFile(filePath)}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all duration-150 ${
                    activeFile === filePath
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-[10px] opacity-60">{getFileIcon(filePath)}</span>
                  <span className="truncate">{getDisplayName(filePath)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {fileTree.slice(0, 6).map((filePath) => (
            <button
              key={filePath}
              onClick={() => setSelectedFile(filePath)}
              className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 whitespace-nowrap transition-all duration-150 ${
                activeFile === filePath
                  ? 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getDisplayName(filePath)}
            </button>
          ))}
          {fileTree.length > 6 && (
            <span className="px-2 text-xs text-gray-400">+{fileTree.length - 6} more</span>
          )}
        </div>

        {/* Monaco */}
        <div className="flex-1 overflow-hidden">
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
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
