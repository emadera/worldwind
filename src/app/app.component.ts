import { Component, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as WorldWind from '@nasaworldwind/worldwind';
import { walmarts } from "./stores/walmarts";
import { targets } from "./stores/targets";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvasOne') canvasOne: ElementRef;
  wwd: any;
  walmartLayer: any;
  targetLayer: any;
  annotationLayer: any;
  selectedAnnotation: any;

  ngAfterViewInit() {

    WorldWind.configuration.baseUrl = "";
    // Set up globe
    this.wwd = new WorldWind.WorldWindow('canvasOne');
    this.wwd.addLayer(new WorldWind.BMNGOneImageLayer());
    this.wwd.addLayer(new WorldWind.BMNGLandsatLayer());
    this.wwd.addLayer(new WorldWind.CompassLayer());
    this.wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(this.wwd));
    this.wwd.addLayer(new WorldWind.ViewControlsLayer(this.wwd));
    
    this.walmartLayer = new WorldWind.RenderableLayer("walmartLayer");
    this.wwd.addLayer(this.walmartLayer);
    this.targetLayer = new WorldWind.RenderableLayer("targetLayer");
    this.wwd.addLayer(this.targetLayer);

    walmarts.forEach(store => {
      this.addStore(store.lat, store.long, 'walmart');
    });
    targets.forEach(store => {
      this.addStore(store.lat, store.long, 'target');
    });

    this.annotationLayer = new WorldWind.RenderableLayer("annotations");
    this.wwd.addLayer(this.annotationLayer);
    
    this.wwd.redraw();
  }

  // Adds a pin marker for a store at the given coordinates. Red for target, blue for walmart
  addStore(latitude, longitude, type) {
    const placemarkAttributes = new WorldWind.PlacemarkAttributes(null);

    placemarkAttributes.imageOffset = new WorldWind.Offset(
      WorldWind.OFFSET_FRACTION, 0.3,
      WorldWind.OFFSET_FRACTION, 0.0
    );

    placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/pushpins/plain-red.png";
    if(type === 'walmart') {
      placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/pushpins/plain-blue.png";
    }
    const position = new WorldWind.Position(latitude, longitude, 0);
    const placemark = new WorldWind.Placemark(position, false, placemarkAttributes);

    placemark.alwaysOnTop = true;
    if(type === 'walmart') {
      this.walmartLayer.addRenderable(placemark);
    }
    else {
      this.targetLayer.addRenderable(placemark);
    }
  }

  addAnnotation(annotation?) {
    var annotationAttributes = new WorldWind.AnnotationAttributes(null);
    annotationAttributes.cornerRadius = 14;
    annotationAttributes.backgroundColor = WorldWind.Color.DARK_GRAY;
    annotationAttributes.drawLeader = true;
    annotationAttributes.leaderGapWidth = 40;
    annotationAttributes.leaderGapHeight = 30;
    annotationAttributes.opacity = 1;
    annotationAttributes.scale = 1;
    annotationAttributes.textAttributes.color = WorldWind.Color.WHITE;
    annotationAttributes.insets = new WorldWind.Insets(10, 10, 10, 10);

    // If an annotation was given, use its data
    let location;
    if(annotation) {
      location = new WorldWind.Position(annotation.position.latitude, annotation.position.longitude, 0);
    }
    else {
      // Init to a point that is on screen (hopefully - worldwind does not seem to provide a good way to detect what is currently visible)
      location = new WorldWind.Position(38, -122, 0);
    }
    const newAnnotation = new WorldWind.Annotation(location, annotationAttributes);
    // Add initial text
    if(annotation) {
      newAnnotation.label = annotation.label;
    }
    else {
      newAnnotation.label = "Insert Annotation Text Here";
    }
    this.annotationLayer.addRenderable(newAnnotation);
    this.selectedAnnotation = newAnnotation;
  }

  toggleWalmarts() {
    this.walmartLayer.enabled = !this.walmartLayer.enabled;
  }
  toggleTargets() {
    this.targetLayer.enabled = !this.targetLayer.enabled;
  }

  pickPosition($event) {
    const picked = this.wwd.pick(this.wwd.canvasCoordinates($event.clientX, $event.clientY));
    if(picked && picked.objects && picked.objects.length > 0) {
      const filteredObjects = picked.objects.filter(item => (item.parentLayer && item.parentLayer.displayName === this.annotationLayer.displayName));
      const annotation = filteredObjects[0];
      if(annotation) {
        this.selectedAnnotation = annotation.userObject;
      }
    }
  }

  refreshAnnotation(annotation) {
    if(annotation) {
      // Annotations are given the proper size on creation, but do not adjust their size when the content changes.
      // Refreshing/redrawing does not solve the problem.
      // Workaround: remove and recreate the annotation after the user finishes editing text
      this.annotationLayer.removeRenderable(annotation);
      this.addAnnotation(annotation);
    }
  }

}
