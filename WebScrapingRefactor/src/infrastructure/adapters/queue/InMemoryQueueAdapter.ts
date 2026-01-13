// import { Url } from "../../../domain/value-objects/Url";
// import { IQueue } from "@/domain/ports/IQueue";

// export class InMemoryQueueAdapter implements IQueue {
//   private queue: Url[] = [];

//   async enqueue(url: Url): Promise<void> {
//     this.queue.push(url);
//   }

//   async dequeue(): Promise<Url | null> {
//     return this.queue.shift() ?? null;
//   }
// }
