"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var isoxml_1 = require("isoxml");
var isoxmlManager = new isoxml_1.ISOXMLManager();
// create an instance of Task entity
var task = isoxmlManager.createEntityFromAttributes(isoxml_1.TAGS.Task, {
    TaskStatus: isoxml_1.TaskTaskStatusEnum.Planned,
    TaskDesignator: 'Test task with partfield'
});
var geoJSONdata = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../data/test.geojson'), 'utf-8'));
var product = isoxmlManager.createEntityFromAttributes(isoxml_1.TAGS.Product, {
    ProductDesignator: 'Test Product'
});
var productRef = isoxmlManager.registerEntity(product);
var valuePresentation = isoxmlManager.createEntityFromAttributes(isoxml_1.TAGS.ValuePresentation, {
    Offset: 0,
    Scale: 0.01,
    NumberOfDecimals: 2
});
var valuePresentationRef = isoxmlManager.registerEntity(valuePresentation);
var doseVariable = isoxmlManager.createEntityFromAttributes(isoxml_1.TAGS.ProcessDataVariable, {
    ProcessDataDDI: '0001',
    ProductIdRef: productRef,
    ValuePresentationIdRef: valuePresentationRef
});
// add Grid to the task from GeoJSON. "0001" is DDI and "DOSE" is the GeoJSON property
task.addGridFromGeoJSON(geoJSONdata, [doseVariable], ['DOSE']);
// create a Partfield from the GeoJSON coordinates and attach it to the Task
var partfield = isoxmlManager.createEntityFromAttributes(isoxml_1.TAGS.Partfield, {
    PartfieldDesignator: 'Test Partfield',
    PartfieldArea: 0
});
var partfieldGeometry = {
    type: 'MultiPolygon',
    coordinates: geoJSONdata.features.map(function (feature) { return feature.geometry.coordinates; })
};
partfield.boundaryFromGeoJSON(partfieldGeometry, isoxmlManager);
var partfieldRef = isoxmlManager.registerEntity(partfield);
isoxmlManager.rootElement.attributes.Partfield = [partfield];
task.attributes.PartfieldIdRef = partfieldRef;
isoxmlManager.rootElement.attributes.Product = [product];
isoxmlManager.rootElement.attributes.ValuePresentation = [valuePresentation];
// assign a local ID to the task and add it to the root element
isoxmlManager.registerEntity(task);
isoxmlManager.rootElement.attributes.Task = [task];
// save ISOXML as a zip file
isoxmlManager.saveISOXML().then(function (data) {
    (0, fs_1.writeFileSync)('./isoxml.zip', data);
});
