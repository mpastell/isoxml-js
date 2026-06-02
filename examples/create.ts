import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ISOXMLManager, TAGS, TaskTaskStatusEnum, ExtendedTask, ExtendedPartfield, ProcessDataVariable, Product, ValuePresentation } from 'isoxml'

const isoxmlManager = new ISOXMLManager()

// create an instance of Task entity
const task = isoxmlManager.createEntityFromAttributes(TAGS.Task, {
    TaskStatus: TaskTaskStatusEnum.Planned,
    TaskDesignator: 'Test task with partfield'
}) as ExtendedTask

const geoJSONdata = JSON.parse(readFileSync(join(__dirname, '../data/test.geojson'), 'utf-8'))

const product = isoxmlManager.createEntityFromAttributes<Product>(TAGS.Product, {
    ProductDesignator: 'Test Product'
})
const productRef = isoxmlManager.registerEntity(product)

const valuePresentation = isoxmlManager.createEntityFromAttributes<ValuePresentation>(TAGS.ValuePresentation, {
    Offset: 0,
    Scale: 0.01,
    NumberOfDecimals: 2
})
const valuePresentationRef = isoxmlManager.registerEntity(valuePresentation)

const doseVariable = isoxmlManager.createEntityFromAttributes<ProcessDataVariable>(
    TAGS.ProcessDataVariable,
    {
        ProcessDataDDI: '0001',
        ProductIdRef: productRef,
        ValuePresentationIdRef: valuePresentationRef
    }
)

// add Grid to the task from GeoJSON. "0001" is DDI and "DOSE" is the GeoJSON property
task.addGridFromGeoJSON(geoJSONdata, [doseVariable], ['DOSE'])

// create a Partfield from the GeoJSON coordinates and attach it to the Task
const partfield = isoxmlManager.createEntityFromAttributes(TAGS.Partfield, {
    PartfieldDesignator: 'Test Partfield',
    PartfieldArea: 0
}) as ExtendedPartfield
const partfieldGeometry = {
    type: 'MultiPolygon' as const,
    coordinates: geoJSONdata.features.map((feature: any) => feature.geometry.coordinates)
}
partfield.boundaryFromGeoJSON(partfieldGeometry, isoxmlManager)
const partfieldRef = isoxmlManager.registerEntity(partfield)

isoxmlManager.rootElement.attributes.Partfield = [partfield]

task.attributes.PartfieldIdRef = partfieldRef

isoxmlManager.rootElement.attributes.Product = [product]
isoxmlManager.rootElement.attributes.ValuePresentation = [valuePresentation]

// assign a local ID to the task and add it to the root element
isoxmlManager.registerEntity(task)
isoxmlManager.rootElement.attributes.Task = [task]

// save ISOXML as a zip file
isoxmlManager.saveISOXML().then((data: Uint8Array) => {
    writeFileSync('./isoxml.zip', data)
})
