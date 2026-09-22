import { Response, NextFunction } from 'express';
import { PelatihService } from './pelatih.service';
import { AuthRequest } from '../../types';

export class PelatihController {
  // GET /api/pelatih - List all pelatih (admin)
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PelatihService.getAll(req.query as any);
      res.json({
        success: true,
        message: 'Data pelatih berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/active-pj - Get pelatih yang menjadi PJ aktif
  static async getActivePJ(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PelatihService.getActivePJ();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/pelatih - Create pelatih (admin)
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PelatihService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Pelatih berhasil dibuat',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/export - Export pelatih data (admin)
  static async getExport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PelatihService.getExport(req.query as any);
      res.json({
        success: true,
        message: 'Export data pelatih berhasil',
        data,
        total: data.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/:id - Detail pelatih (admin)
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.getById(id);
      res.json({
        success: true,
        message: 'Detail pelatih berhasil diambil',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/pelatih/:id - Update pelatih (admin)
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.update(id, req.body);
      res.json({
        success: true,
        message: 'Data pelatih berhasil diupdate',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/pelatih/:id - Nonaktifkan pelatih (admin)
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.delete(id);
      res.json({ success: true, message: 'Pelatih berhasil diarsipkan', data });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/archived - List pelatih yang diarsipkan (admin)
  static async getArchived(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PelatihService.getArchived();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/pelatih/:id/restore - Pulihkan pelatih dari arsip (admin)
  static async restore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.restore(id);
      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/pelatih/:id/permanent - Hapus permanen pelatih (admin)
  static async permanentDelete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.permanentDelete(id);
      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/:id/delete-preview - Preview data terkait sebelum hapus permanen
  static async getDeletePreview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.getDeletePreview(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/pelatih/:id/status - Toggle status (admin)
  static async toggleStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PelatihService.toggleStatus(id);
      res.json({
        success: true,
        message: `Status pelatih berhasil diubah ke ${data.status}`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pelatih/:id/anggota - List anggota (admin, pelatih self)
  static async getAnggota(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PelatihService.getAnggota(id);
      res.json({
        success: true,
        message: 'Data anggota berhasil diambil',
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }
}
