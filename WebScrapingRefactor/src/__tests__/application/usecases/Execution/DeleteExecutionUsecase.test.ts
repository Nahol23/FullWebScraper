import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteExecutionUseCase } from '../../../../application/usecases/Execution/DeleteExecutionUsecase';

describe('DeleteExecutionUseCase', () => {
  const mockExecutionRepo = { delete: vi.fn() };
  let useCase: DeleteExecutionUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeleteExecutionUseCase(mockExecutionRepo as any);
  });

  it('dovrebbe chiamare il metodo delete del repository con l\'id corretto', async () => {
    const executionId = 'exec-to-delete';
    
    await useCase.execute(executionId);

    expect(mockExecutionRepo.delete).toHaveBeenCalledTimes(1);
    expect(mockExecutionRepo.delete).toHaveBeenCalledWith(executionId);
  });

  it('dovrebbe propagare l\'errore se il repository fallisce', async () => {
    mockExecutionRepo.delete.mockRejectedValue(new Error('Delete failed'));
    
    await expect(useCase.execute('id')).rejects.toThrow('Delete failed');
  });
});