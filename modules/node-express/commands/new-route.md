# Scaffold New Route

Generate a complete, typed route for a new resource following the router → controller → service pattern.

## Steps

1. Ask the user for:
   - **Resource name** (singular noun, e.g., `product`, `invoice`, `comment`)
   - **Operations to include**: list (GET all), get (GET one by ID), create (POST), update (PUT/PATCH), delete (DELETE)
   - **Scope**: does this resource belong to a parent (e.g., comments belong to a post)?

2. Generate the following files, replacing `<Resource>` with PascalCase and `<resource>` with camelCase/kebab-case:

### `src/routes/<resource>s.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as controller from '../controllers/<resource>s.controller';
import { create<Resource>Schema, update<Resource>Schema } from '../models/<resource>.schema';

export const <resource>sRouter = Router();

<resource>sRouter.get('/', requireAuth, controller.list<Resource>s);
<resource>sRouter.get('/:id', requireAuth, controller.get<Resource>);
<resource>sRouter.post('/', requireAuth, validate(create<Resource>Schema), controller.create<Resource>);
<resource>sRouter.put('/:id', requireAuth, validate(update<Resource>Schema), controller.update<Resource>);
<resource>sRouter.delete('/:id', requireAuth, controller.delete<Resource>);
```

### `src/controllers/<resource>s.controller.ts`

```typescript
import { Request, Response } from 'express';
import { <Resource>Service } from '../services';

const service = new <Resource>Service();

export async function list<Resource>s(req: Request, res: Response): Promise<void> {
  const items = await service.list(req.user!.id);
  res.json({ data: items });
}

export async function get<Resource>(req: Request, res: Response): Promise<void> {
  const item = await service.getById(req.params.id);
  res.json({ data: item });
}

export async function create<Resource>(req: Request, res: Response): Promise<void> {
  const item = await service.create(req.user!.id, req.body);
  res.status(201).json({ data: item });
}

export async function update<Resource>(req: Request, res: Response): Promise<void> {
  const item = await service.update(req.params.id, req.user!.id, req.body);
  res.json({ data: item });
}

export async function delete<Resource>(req: Request, res: Response): Promise<void> {
  await service.delete(req.params.id, req.user!.id);
  res.status(204).send();
}
```

### `src/services/<resource>s.service.ts`

```typescript
import { NotFoundError, ForbiddenError } from '../models/errors';
import { <Resource>Repository } from '../repositories';
import type { Create<Resource>Dto, Update<Resource>Dto, <Resource> } from '../models/<resource>.types';

export class <Resource>Service {
  private repo = new <Resource>Repository();

  async list(userId: string): Promise<<Resource>[]> {
    return this.repo.findByUserId(userId);
  }

  async getById(id: string): Promise<<Resource>> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError('<Resource>', id);
    return item;
  }

  async create(userId: string, dto: Create<Resource>Dto): Promise<<Resource>> {
    return this.repo.create({ ...dto, userId });
  }

  async update(id: string, userId: string, dto: Update<Resource>Dto): Promise<<Resource>> {
    const item = await this.getById(id);
    if (item.userId !== userId) throw new ForbiddenError();
    return this.repo.update(id, dto);
  }

  async delete(id: string, userId: string): Promise<void> {
    const item = await this.getById(id);
    if (item.userId !== userId) throw new ForbiddenError();
    await this.repo.delete(id);
  }
}
```

3. Generate typed interfaces in `src/models/<resource>.types.ts`:

```typescript
export interface <Resource> {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // TODO: add resource-specific fields
}

export type Create<Resource>Dto = Omit<<Resource>, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type Update<Resource>Dto = Partial<Create<Resource>Dto>;
```

4. Generate the {{validation_library}} schema in `src/models/<resource>.schema.ts`.

5. Register the router in `src/routes/index.ts`:

```typescript
import { <resource>sRouter } from './<resource>s';
apiRouter.use('/<resource>s', <resource>sRouter);
```

6. Remind the user to add repository implementation and database migration.

## Notes

- All routes are under the `{{api_prefix}}` prefix via the root router.
- Remove unused CRUD operations if the user requested only a subset.
- Use plural resource names in URLs (`/products`, not `/product`).
