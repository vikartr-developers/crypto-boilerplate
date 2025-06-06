// utils/prisma-pagination.ts
import { Prisma } from '@prisma/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchFields?: string[]; 
  baseWhere?: any; 
}

/**
 * Generic paginated find all for any Prisma model delegate
 *
 * @param modelDelegate - e.g. prisma.role or prisma.user
 * @param options - pagination and filtering options
 * @returns paginated result with meta info
 */
export async function findAllPaginated<T>(
  modelDelegate: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: { where?: any }) => Promise<number>;
  },
  options: PaginationOptions,
) {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder = 'asc',
    searchFields = [],
    baseWhere = {},
  } = options;

  const skip = (page - 1) * limit;

  let where: any = baseWhere;

  if (search && searchFields.length) {
    where = {
      AND: [
        baseWhere,
        {
          OR: searchFields.map((field) => ({
            [field]: {
              contains: search,
              mode: 'insensitive',
            },
          })),
        },
      ],
    };
  }

  let orderBy = {};

  if (sortBy) {
    orderBy = {
      [sortBy]: sortOrder,
    };
  }

  const [data, total] = await Promise.all([
    modelDelegate.findMany({
      skip,
      take: limit,
      where,
      orderBy,
    }),
    modelDelegate.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalpages: Math.ceil(total / limit),
    },
  };
}
