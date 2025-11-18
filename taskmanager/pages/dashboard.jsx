import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Column from "../components/Column";
import { useTasks } from "../hooks/useTasks";

export default function Dashboard() {
  const { tasks, updateTaskStatus, reorderTasks } = useTasks();

  const columns = {
    todo: tasks.filter(t => t.status === "todo"),
    inprogress: tasks.filter(t => t.status === "inprogress"),
    done: tasks.filter(t => t.status === "done")
  };

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Same column reorder
    if (source.droppableId === destination.droppableId) {
      reorderTasks(source, destination);
      return;
    }

    // Move between columns
    updateTaskStatus(draggableId, destination.droppableId);
  }

  return (
    <div className="flex h-full bg-[#1C1C1E] text-white p-6 gap-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Column title="To Do" id="todo" tasks={columns.todo} />
        <Column title="In Progress" id="inprogress" tasks={columns.inprogress} />
        <Column title="Completed" id="done" tasks={columns.done} />
      </DragDropContext>

      {/* Add Task Floating Button */}
      <button className="fixed bottom-6 right-6 bg-[#A259FF] text-white w-14 h-14 rounded-full shadow-lg text-3xl hover:scale-105 transition">
        +
      </button>
    </div>
  );
}
