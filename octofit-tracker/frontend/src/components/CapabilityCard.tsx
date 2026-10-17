import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiRecord = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  fetchPath: string;
  emptyText: string;
  renderItem: (item: ApiRecord, index: number) => React.ReactNode;
};

export function CapabilityCard({ title, description, fetchPath, emptyText, renderItem }: Props) {
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getJson<ApiRecord>(fetchPath)
      .then((payload) => {
        if (!active) return;
        const collection = Object.values(payload).find(Array.isArray);
        setItems((collection ?? []) as ApiRecord[]);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error && loadError.message ? loadError.message : 'Unable to load data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchPath]);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading {title.toLowerCase()}...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="alert">Unable to load {title.toLowerCase()}. Please try again.</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p>{emptyText}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        <ul className="list-unstyled mb-0">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{renderItem(item, index)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
