import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Board = ({ tasks, setTasks, onUpdateTask }) => {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = source.droppableId;
    const finish = destination.droppableId;

    if (start === finish) {
      // Reorder tasks within the same column
      const newTasks = Array.from(tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);
      setTasks(newTasks);
      return;
    }

    // Moving from one list to another
    const startTasks = tasks.filter(task => task.status === start);
    const finishTasks = tasks.filter(task => task.status === finish);

    const [removed] = startTasks.splice(source.index, 1);
    removed.status = finish;
    finishTasks.splice(destination.index, 0, removed);

    const newTasks = tasks.map(task => {
      if (task._id === draggableId) {
        return { ...task, status: finish };
      }
      return task;
    });

    setTasks(newTasks);
    onUpdateTask(draggableId, { status: finish });
  };

  const columns = {
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Done': tasks.filter(task => task.status === 'Done'),
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="row">
        {Object.entries(columns).map(([columnId, columnTasks]) => (
          <div className="col-md-4" key={columnId}>
            <h2>{columnId}</h2>
            <Droppable droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`list-group ${snapshot.isDraggingOver ? 'bg-light' : ''}`}
                >
                  {columnTasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`list-group-item ${snapshot.isDragging ? 'bg-light' : ''}`}
                        >
                          <h5>{task.title}</h5>
                          <p>{task.description}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default Board;
