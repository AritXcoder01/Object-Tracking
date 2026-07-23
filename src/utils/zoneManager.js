export class ZoneManager {
  constructor() {
    this.zones = [];
    this.nextZoneId = 1;
  }

  addZone(zoneData) {
    const newZone = {
      id: `zone_${this.nextZoneId++}`,
      name: zoneData.name || `Zone ${this.nextZoneId - 1}`,
      x: zoneData.x,
      y: zoneData.y,
      width: zoneData.width,
      height: zoneData.height,
      color: zoneData.color || '#00d4ff',
      objectCount: 0,
      alerts: []
    };
    this.zones.push(newZone);
    return newZone;
  }

  handleDraw(event) {
    const target = event.currentTarget;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert screen click coordinates to canvas internal pixel scale
    const scaleX = target.width ? target.width / rect.width : 1;
    const scaleY = target.height ? target.height / rect.height : 1;

    const width = 160 * scaleX;
    const height = 160 * scaleY;
    const x = Math.max(0, clickX * scaleX - width / 2);
    const y = Math.max(0, clickY * scaleY - height / 2);

    return this.addZone({ x, y, width, height, name: `Zone ${this.nextZoneId}` });
  }

  removeZone(id) {
    this.zones = this.zones.filter(z => z.id !== id);
  }

  clearZones() {
    this.zones = [];
    this.nextZoneId = 1;
  }

  getZones() {
    return this.zones;
  }

  isPointInZone(point, zone) {
    return point.x >= zone.x && 
           point.x <= zone.x + zone.width && 
           point.y >= zone.y && 
           point.y <= zone.y + zone.height;
  }

  checkObjectsInZones(trackedObjectsMap) {
    const results = [];
    const trackedObjects = Array.from(trackedObjectsMap.values());

    for (const zone of this.zones) {
      const objectsInZone = trackedObjects.filter(obj => 
        this.isPointInZone(obj.centroid, zone)
      );

      zone.objectCount = objectsInZone.length;

      results.push({
        zoneId: zone.id,
        zoneName: zone.name,
        objectCount: zone.objectCount,
        objects: objectsInZone,
        isCrowded: zone.objectCount > 5
      });
    }

    return results;
  }

  generateAlerts(zoneResults, previousResults) {
    const alerts = [];
    const now = Date.now();

    for (const current of zoneResults) {
      const prev = previousResults.find(r => r.zoneId === current.zoneId);
      
      if (!prev) continue;

      const currentIds = new Set(current.objects.map(o => o.id));
      const prevIds = new Set(prev.objects.map(o => o.id));

      const entered = [...currentIds].filter(id => !prevIds.has(id));
      const left = [...prevIds].filter(id => !currentIds.has(id));

      if (entered.length > 0) {
        alerts.push({
          type: 'entered',
          message: `${entered.length} object(s) entered ${current.zoneName}`,
          zoneId: current.zoneId,
          zoneName: current.zoneName,
          timestamp: now
        });
      }

      if (left.length > 0) {
        alerts.push({
          type: 'left',
          message: `${left.length} object(s) left ${current.zoneName}`,
          zoneId: current.zoneId,
          zoneName: current.zoneName,
          timestamp: now
        });
      }

      if (current.isCrowded && !prev.isCrowded) {
        alerts.push({
          type: 'crowding',
          message: `Crowding detected in ${current.zoneName} (${current.objectCount} objects)`,
          zoneId: current.zoneId,
          zoneName: current.zoneName,
          timestamp: now
        });
      }
    }

    return alerts;
  }
}
