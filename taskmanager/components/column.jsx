import { Droppable, Draggable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";

export default function Column({ title, id, tasks }) {
  return (
    <div className="flex-1 bg-[#2A2A2C] rounded-xl p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <Droppable droppableId={id}>
        {(provided) => (
          <div
            className="flex flex-col gap-4"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
