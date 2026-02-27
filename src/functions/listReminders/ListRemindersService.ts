import type {ReminderRepository} from '../../repository';
import type {Reminder} from '../../models/internal';
import type {ListRemindersQuery} from '../../validation/ListRemindersQuerySchema';
import {Page} from "../../models/common";

export class ListRemindersService {
    constructor(private readonly repository: ReminderRepository) {
    }

    async execute(input: ListRemindersQuery): Promise<Page<Reminder>> {
        const {status, limit, nextToken} = input;

        return status
            ? this.repository.listByStatus(status, {limit, nextToken})
            : this.repository.listAll({limit, nextToken});
    }
}
