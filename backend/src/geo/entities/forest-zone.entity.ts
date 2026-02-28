import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
} from "typeorm";

@Entity("forest_zones")
export class ForestZone {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	osmId: string;

	@Column({ nullable: true })
	name: string;

	@Column({ default: "Feuillu mixte" })
	species: string;

	@Column({ default: "Forêt" })
	forestType: string;

	@Column({ type: "float", nullable: true })
	density: number;

	@Column({ type: "float", nullable: true })
	height: number;

	@Column({ type: "float", default: 0 })
	areaHa: number;

	@Column({
		type: "geometry",
		spatialFeatureType: "Geometry",
		srid: 4326,
	})
	@Index({ spatial: true })
	geom: any;

	@CreateDateColumn()
	createdAt: Date;
}
