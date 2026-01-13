// import { ICleaner } from "@/domain/ports/ICleaner";
// import { IQueue } from "@/domain/ports/IQueue";
// import { IParser } from "@/domain/ports/IParser";

// export class CrawlNextUrlUseCase {
//   constructor(
//     private queue: IQueue,
//     private parser: IParser,
//     private cleaner: ICleaner
//   ) {}

//   async execute(): Promise<string | null> {
//     const url = await this.queue.dequeue();
//     if (!url) return null;

//     const raw = await this.parser.parse(url.toString());
//     const markdown = await this.cleaner.clean(raw);
//     return markdown;
//   }
// }
