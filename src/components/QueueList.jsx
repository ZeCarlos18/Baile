import "../styles/Queue.css"

function QueueList({ queue }) {
  return (
    <div className="queue-container">
      <h3 className="queue-title">🎵 Próximas Músicas</h3>
      <div className="queue-list">
        {queue.length === 0 ? (
          <p className="queue-empty">Nenhuma música na fila...</p>
        ) : (
          <ul className="queue-items">
            {queue.map((entry, index) => (
              <li key={entry.entryId} className="queue-item">
                <span className="queue-number">{index + 1}</span>
                <span className="queue-title-text">{entry.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default QueueList
