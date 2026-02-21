function QueueList({ queue }) {
  return (
    <div>
      <h3>Fila:</h3>
      <ul>
        {queue.map((v, i) => (
          <li key={i}>{v.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default QueueList