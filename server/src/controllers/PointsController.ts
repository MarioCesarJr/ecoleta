import { Request, Response } from 'express';
import Knex from '../database/connection';

class PointsController {
    async index(req: Request, res: Response){
        const { city, uf, items } = req.query;
        
        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points = await Knex('points')
        .join('points_items', 'points.id', '=', 'points_items.points_id')
        .whereIn('points_items.items_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');

        const serializedPoints = points.map(point => {
            return {
              ...point,
              image_url: `http://192.168.0.11:3333/uploads/${point.image}`  
            }
        });
        
        return res.json(serializedPoints);
    };

    async show(req: Request, res: Response) {
        const { id } = req.params;

        const point = await Knex('points').where('id', id).first();

        if(!point) {
            return res.status(400).json({ message: 'Point not found' });
        }

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.0.11:3333/uploads/${point.image}`  
        };

        const items = await Knex('items')
        .join('points_items', 'items.id', '=', 'points_items.items_id')
        .where('points_items.points_id', id)
        .select('items.title');

        return res.json({
            point: serializedPoint,
            items
        });
    };

    async create(req: Request, res: Response) {
        const {
          name,
          email,
          whatsapp,
          latitude,
          longitude,
          city,
          uf,
          items
        } = req.body
    
        const trx = await Knex.transaction();

        const points = {
            image: req.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }
    
        const insertedIds = await trx('points').insert(points);
    
        const points_id = insertedIds[0];
    
        const points_items = items
        .split(',')
        .map((item: string) => Number(item.trim()))
        .map((items_id: number) => {
          return {
            items_id,
            points_id
          }
        });
    
        await trx('points_items').insert(points_items);

        await trx.commit();
    
        return res.json({
            id: points_id,
            ...points,
        });
    }
};

export default PointsController;