import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { iframeScript } from '../assets/assets';
import EditorPanel from './EditorPanel';
import LoaderSteps from './LoaderSteps';

export interface ProjectPreviewRef {
  getCode: () => string | undefined;
}

export interface ProjectPreviewProps {
  project: any;
  isGenerating: boolean;
  device?: 'phone' | 'tablet' | 'desktop';
  showEditorPanel?: boolean;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>
  (({ project, isGenerating, device = 'desktop', showEditorPanel = true }, ref) => {

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [selectedElement, setSelectedElement] = useState<any>(null)

    const resolutions = {
      phone: 'w-[415px]',
      tablet: 'w-[768px]',
      desktop: 'w-full',
    }

    useImperativeHandle(ref, () => ({
      getCode: () => {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return undefined;
        // 1. Remove our selection class / attributes / outline form all elements
        doc.querySelectorAll('.ai-selected-element').forEach((el) => {
          el.classList.remove('ai-selected-element');
          el.removeAttribute('data-ai-selected');
          (el as HTMLElement).style.outline = '';
        });
        // 2. Remove injected style + script from the document
        const previewStyle = doc.getElementById('ai-preview-style');
        if (previewStyle) previewStyle.remove();

        const previewScript = doc.getElementById('ai-preview-script');
        if (previewScript) previewScript.remove();

        // 3. Serialize clean HTML
        const html = doc.documentElement.outerHTML;
        return html;
      }
    }))

    useEffect(() => {
      const handleMesage = (event: MessageEvent) => {
        if (event.data.type === 'ELEMENT_SELECTED') {
          setSelectedElement(event.data.payload);
        } else {
          setSelectedElement(null)
        }
      }
      window.addEventListener('message', handleMesage);
      return () => window.removeEventListener('message', handleMesage)
    }, [])

    const injectPreview = (html: string) => {
      if (!html) return '';
      if (!showEditorPanel) return html;

      if (html.includes('</body>')) {
        return html.replace('</body>', iframeScript + '</body>');
      } else {
        return html + iframeScript;
      }

    }

    const handleUpdate = (updates: any) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_ELEMENT',
          payload: updates
        }, '*')
      }
    }

    return (
      <div className='relative h-full  flex-1 rounded-xl overflow-hidden max-sm:ml-2'>
        {project.current_code ? (
          <>
            <iframe ref={iframeRef} srcDoc={injectPreview(project.current_code)} className={`h-full max-w-full ${resolutions[device]} mx-auto transition-all`} />
            {showEditorPanel && selectedElement && (
              <EditorPanel selectedElement={selectedElement} onUpdate={handleUpdate} onClose={() => {
                setSelectedElement(null)
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_SELECTION_REQUEST' }, '*')
                }
              }} />
            )}
          </>
        ) : isGenerating && (
          <LoaderSteps />
        )}
      </div>
    )
  })

export default ProjectPreview
