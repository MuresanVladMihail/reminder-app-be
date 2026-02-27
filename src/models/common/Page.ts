export interface Page<T> {
  items: T[];
  nextToken?: string;
}
