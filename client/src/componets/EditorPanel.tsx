import { X } from 'lucide-react';
import { useEffect, useState } from 'react'

interface EditorPanelProps {
  selectedElement: {
    tagName: string;
    className: string;
    text: string;
    styles: {
      padding: string;
      margin: string;
      backgroundColor: string;
      color: string;
      fontSize: string;
    }
  } | null;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

const EditorPanel = ({ selectedElement, onUpdate, onClose }: EditorPanelProps) => {

  const [values, setvalues] = useState(selectedElement);

  const toHexColor = (color: string) => {
    if (!color) return '#ffffff';
    const c = color.trim().toLowerCase();
    if (c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(0,0,0,0)') {
      return '#ffffff';
    }
    if (c.startsWith('#')) return c;
    const rgbMatch = c.match(/^rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,\s*([\d.]+)\s*)?\)$/);
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])));
      const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])));
      const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])));
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    // Fallback: try using browser to resolve named colors
    const el = document.createElement('div');
    el.style.color = c;
    document.body.appendChild(el);
    const cs = getComputedStyle(el).color;
    document.body.removeChild(el);
    const m = cs.match(/^rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,\s*([\d.]+)\s*)?\)$/);
    if (m) {
      const r = parseInt(m[1]);
      const g = parseInt(m[2]);
      const b = parseInt(m[3]);
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return '#ffffff';
  }

  useEffect(() => {
    setvalues(selectedElement)
  }, [selectedElement])

  if (!selectedElement || !values) return null;


  const handleChange = (field: string, value: string) => {
    const newValues = { ...values, [field]: value };
    if (field in values.styles) {
      newValues.styles = { ...values.styles, [field]: value };
    }
    setvalues(newValues);
    onUpdate(newValues);
  }

  const handleStyleChange = (styleName: string, value: string) => {
    const newStyles = { ...values.styles, [styleName]: value };
    setvalues({ ...values, styles: newStyles });
    onUpdate({ styles: { [styleName]: value } });
  }

  return (
    <div className='absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-fade-in fade-in slide-in-from-right-5'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='font-semibold text-gray-800'>Edit Element</h3>
        <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded-full'>
          <X className='w-4 h-4 text-gray-500' />
        </button>
      </div>
      <div className='space-y-4 text-black'>
        <div className=''>
          <label className='block text-xs font-medium text-gray-500 mb-1'>Text Content</label>
          <textarea value={values.text} onChange={(e) => handleChange('text', e.target.value)} className='w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none min-h-20' />
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-500 mb-1'>ClassName</label>
          <input type='text' value={values.className} onChange={(e) => handleChange('className', e.target.value)} className='w-full border border-gray-400 text-sm p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none' />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Padding</label>
            <input type='text' value={values.styles.padding} onChange={(e) => handleStyleChange('padding', e.target.value)} className='w-full border border-gray-400 text-sm p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none' />
          </div>
          <div>

            <label className='block text-xs font-medium text-gray-500 mb-1'>Margin</label>
            <input
              type='text'
              value={values.styles.margin}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
              className='w-full border border-gray-400 text-sm p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none' />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Font Size</label>
            <input
              type='text'
              value={values.styles.fontSize}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              className='w-full border border-gray-400 text-sm p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none' />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Background</label>
            <div>
              <input
                type='color'
                value={toHexColor(values.styles.backgroundColor)}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className='w-6 h-6 cursor-pointer' />
              <span className='text-xs text-gray-600 truncate'>{values.styles.backgroundColor}</span>
            </div>
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Text Color</label>
            <div>
              <input
                type='color'
                value={toHexColor(values.styles.color)}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className='w-6 h-6 cursor-pointer' />
              <span className='text-xs text-gray-600 truncate'>{values.styles.color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
