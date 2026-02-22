function QueueList({ queue }) {
  return (
    <div>
      <h3>Fila/Roleta:</h3>
      <ul>
        {queue.map((v) => (
          <li key={v.id}>{v.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default QueueList