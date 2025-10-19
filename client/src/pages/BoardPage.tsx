import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Square, Circle, Type, Trash2, Save, Presentation } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBoard, updateBoard } from '../services/api';

const BoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<any>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rectangle' | 'circle'>('select');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchBoard();
    }
  }, [id]);

  const fetchBoard = async () => {
    try {
      const data = await getBoard(id!);
      setBoard(data);
      setElements(data.elements || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBoard(id!, { elements });
      toast.success('Board saved!');
    } catch (err) {
      toast.error('Failed to save board');
    } finally {
      setSaving(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement: any = {
      id: Date.now().toString(),
      x,
      y,
      width: 150,
      height: 100,
    };

    if (selectedTool === 'text') {
      newElement.type = 'text';
      newElement.content = 'Double click to edit';
      newElement.fontSize = 16;
    } else if (selectedTool === 'rectangle') {
      newElement.type = 'shape';
      newElement.shapeType = 'rectangle';
      newElement.color = '#3b82f6';
    } else if (selectedTool === 'circle') {
      newElement.type = 'shape';
      newElement.shapeType = 'circle';
      newElement.color = '#10b981';
    }

    setElements([...elements, newElement]);
    setSelectedTool('select');
  };

  const handleDeleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/boards')}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{board?.name}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2">
        <button
          onClick={() => setSelectedTool('select')}
          className={`p-2 rounded-lg transition-colors ${selectedTool === 'select' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
          title="Select"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3l14 7-6 2-2 6z" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedTool('text')}
          className={`p-2 rounded-lg transition-colors ${selectedTool === 'text' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
          title="Text"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => setSelectedTool('rectangle')}
          className={`p-2 rounded-lg transition-colors ${selectedTool === 'rectangle' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
          title="Rectangle"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => setSelectedTool('circle')}
          className={`p-2 rounded-lg transition-colors ${selectedTool === 'circle' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}`}
          title="Circle"
        >
          <Circle size={20} />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="flex-1 bg-gray-50 relative overflow-auto cursor-crosshair"
        style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {elements.map((element) => (
          <div
            key={element.id}
            className="absolute group"
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
            }}
          >
            {element.type === 'text' && (
              <div
                className="w-full h-full p-2 bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-sm"
                style={{ fontSize: element.fontSize }}
              >
                {element.content}
              </div>
            )}
            {element.type === 'shape' && element.shapeType === 'rectangle' && (
              <div
                className="w-full h-full rounded-lg shadow-md"
                style={{ backgroundColor: element.color }}
              />
            )}
            {element.type === 'shape' && element.shapeType === 'circle' && (
              <div
                className="w-full h-full rounded-full shadow-md"
                style={{ backgroundColor: element.color }}
              />
            )}
            <button
              onClick={() => handleDeleteElement(element.id)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Instructions */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Presentation className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Empty Board</h3>
            <p className="text-gray-600">Select a tool from the toolbar and click on the canvas to add elements</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
