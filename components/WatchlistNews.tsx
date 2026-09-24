import { formatTimeAgo } from '@/lib/utils';

export default function WatchlistNews({ news, unavailable }: WatchlistNewsProps) {
  return (
    <section className="watchlist-news-section space-y-4">
      <h2 className="text-lg font-semibold text-gray-100">Market news</h2>
      <div className="watchlist-news">
        {unavailable ? (
          <p className="text-gray-500 col-span-full">News unavailable</p>
        ) : !news?.length ? (
          <p className="text-gray-500 col-span-full">No recent news for your watchlist symbols.</p>
        ) : (
          news.map((article) => (
            <article key={`${article.id}-${article.url}`} className="news-item flex flex-col">
              {article.related ? (
                <span className="news-tag">{article.related}</span>
              ) : null}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col flex-1"
              >
                <h3 className="news-title">{article.headline}</h3>
                <p className="news-meta">
                  {article.source}
                  {article.datetime ? ` · ${formatTimeAgo(article.datetime)}` : null}
                </p>
                {article.summary ? <p className="news-summary">{article.summary}</p> : null}
                <span className="news-cta mt-auto">Read</span>
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
