export default function TaskCard({ task }) {
  return (
    <div className="bg-[#1C1C1E] p-4 rounded-xl shadow hover:shadow-lg transition hover:ring-2 hover:ring-[#A259FF] cursor-pointer">
      <h3 className="font-semibold text-lg">{task.title}</h3>
      {task.estimatedMinutes && (
        <p className="text-sm text-[#B3B3B3]">
          {task.estimatedMinutes} min
        </p>
      )}
      {task.dueDate && (
        <p className="text-sm text-blue-400">
          Due: {new Date(task.dueDate.seconds * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
