import type { Request, Response } from 'express';
import { parseFile, aquaMark } from '../../../utils/parser';
import { countAverageRating, contentParser } from '../../../utils/article';

const mark = (data: any, str: string) => aquaMark(contentParser(data, str));

export function get(req: Request, res: Response) {
	const { category, slug } = req.params;
	const filepath = `content/reviews/${category}/${slug}.md`;
	function hydrate(data: RawReview, content: string): FinalReview {
		const { published, updated } = data.date;
		const [dStart, dSeen] = [new Date(updated || published), new Date(data.last_seen)];

		const review: FinalReview = { slug: `${category}/${slug}`, category, ...data };
		review.composed = (dStart.getTime() - dSeen.getTime()) / 1000 / 24 / 60 / 60;

		const [article, closing] = content.split(/^## \$CLOSING/m);
		if (closing) review.closing = mark(review, closing);

		const [summary, spoilers] = article.split(/^## \$SPOILERS/m);
		if (spoilers) review.spoilers = mark(review, spoilers);

		review.content = contentParser(review, summary);
		review.rating = countAverageRating(data.rating);
		return review;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(parseFile(filepath, hydrate)));
}
