import { useProjectStore } from '../../stores/projectStore';
import { getTemplatesByProvider } from '../../constants/templates';

export default function TemplateSelector() {
  const { project, selectedTemplate, loadTemplate } = useProjectStore();
  const templates = getTemplatesByProvider(project.provider || 'aws');

  return (
    <div>
      <h2 className="section-label mb-3">Templates</h2>
      <div className="space-y-1.5">
        {templates.map((template) => {
          const active = selectedTemplate === template.id;
          return (
            <label
              key={template.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                active
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={active}
                onChange={() => loadTemplate(template.id)}
                className="mt-0.5 text-blue-500 border-gray-300 focus:ring-blue-500 focus:ring-offset-0"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${active ? 'text-blue-800' : 'text-gray-800'}`}>
                  {template.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
