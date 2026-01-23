import { useProjectStore } from '../../stores/projectStore';
import { TEMPLATES } from '../../constants/templates';

export default function TemplateSelector() {
  const { selectedTemplate, loadTemplate } = useProjectStore();

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Templates
      </h2>
      <div className="space-y-2">
        {TEMPLATES.map((template) => (
          <label
            key={template.id}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedTemplate === template.id
                ? 'bg-blue-600/20 border border-blue-500/50'
                : 'bg-gray-700/50 border border-transparent hover:bg-gray-700'
            }`}
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={selectedTemplate === template.id}
              onChange={() => loadTemplate(template.id)}
              className="mt-1 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">
                {template.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {template.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
