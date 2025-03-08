$(function() {
    const { Subject } = rxjs;
    const eventBus = new Subject();
    
    $('video-component')[0].subject = eventBus
    $('piano-component')[0].subject = eventBus
    
});