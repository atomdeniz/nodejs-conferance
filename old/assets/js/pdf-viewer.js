var pdfJsRenderer = {
    render: function (url, options, isAreaShowing, clickedAreaCallback, zoomLevelChanged) {
        var canvasContainer = document.getElementById('pdf-container');
        $('#pdf-click-container').on('click', function (e) {
            var minWidth = $(this).css('min-width').replace('px', '');
            var minHeight = $(this).css('min-height').replace('px', '');
            var width = $(this).css('width').replace('px', '');
            var height = $(this).css('height').replace('px', '');

            var realX = minWidth / width * e.originalEvent.layerX;
            var realY = minHeight / height * e.originalEvent.layerY;

            if (typeof clickedAreaCallback !== typeof undefined && clickedAreaCallback !== false) {
                clickedAreaCallback({
                    Y: e.originalEvent.layerY,
                    X: e.originalEvent.layerX,
                    width,
                    height,
                    minWidth,
                    minHeight,
                    realX,
                    realY
                });
            }
        });
        $('#pdf-button-tag-marking').on('click', function (e) {
            var container = $('#pdf-click-container');
            var attr = container.attr('marking');
            if (typeof attr !== typeof undefined && attr !== false) {
                container.hide();
                container.removeAttr('marking');
                if (typeof isAreaShowing !== typeof undefined && isAreaShowing !== false) {
                    isAreaShowing(false);
                };
                $('#pdf-button-tag-marking').html('<i class="fa fa-commenting"></i>');
            } else {
                container.show();
                container.attr('marking', 'marking');
                if (typeof isAreaShowing !== typeof undefined && isAreaShowing !== false) {
                    isAreaShowing(true);
                };
                $('#pdf-button-tag-marking').html('<i class="fa fa-link"></i>');
            }
        });
        $('#pdf-button-reset-zoom').on('click', function (e) {
            $('#pdf-click-container').css({
                width: 'auto',
                height: 'auto'
            });
            $('#pdf-container').css({
                width: 'auto',
                height: 'auto'
            });
            if (typeof zoomLevelChanged !== typeof undefined && zoomLevelChanged !== false) {
                zoomLevelChanged();
            }
        });
        $('#pdf-button-add-zoom').on('click', function (e) {
            var ratio = $("#pdf-click-container").height() / $("#pdf-click-container").width();
            var nextWidth = $("#pdf-click-container").width() + 100;
            var height = nextWidth * ratio;
            $("#pdf-click-container").width(nextWidth);
            $("#pdf-container").width(nextWidth);

            $("#pdf-click-container").height(height);
            $("#pdf-container").height(height);
            if (typeof zoomLevelChanged !== typeof undefined && zoomLevelChanged !== false) {
                zoomLevelChanged();
            }
        });
        $('#pdf-button-remove-zoom').on('click', function (e) {
            var ratio = $("#pdf-click-container").height() / $("#pdf-click-container").width();
            var nextWidth = $("#pdf-click-container").width() - 100;
            var height = nextWidth * ratio;
            $("#pdf-click-container").width(nextWidth);
            $("#pdf-container").width(nextWidth);

            $("#pdf-click-container").height(height);
            $("#pdf-container").height(height);
            if (typeof zoomLevelChanged !== typeof undefined && zoomLevelChanged !== false) {
                zoomLevelChanged();
            }
        });

        var options = options || {
            scale: 1
        };

        function renderPage(page) {
            var viewport = page.getViewport(options.scale);
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = "pdf-data";
            canvas.id = "pdf-page-" + page.pageIndex;
            console.log(canvas);
            canvasContainer.appendChild(canvas);

            console.log(viewport.height, viewport.width)
            page.render(renderContext);

            var holderWidth = $('#pdf-container').width();
            var holderHeight = viewport.height / viewport.width * holderWidth * (page.pageIndex + 1)

            $('#pdf-click-container').css({
                'height': holderHeight,
                'width': holderWidth,
                'min-height': holderHeight,
                'min-width': holderWidth
            });
            $('#pdf-container').css({
                'height': holderHeight,
                'width': holderWidth,
                'min-height': holderHeight,
                'min-width': holderWidth
            });
        }

        function renderPages(pdfDoc) {
            for (var num = 1; num <= pdfDoc.numPages; num++)
                pdfDoc.getPage(num).then(renderPage);

        }
        PDFJS.disableWorker = true;

        if (getAuthenticationToken() === "") {
            PDFJS.getDocument({
                url: url,
                withCredentials: true
            }).then(renderPages);
        } else {
            PDFJS.getDocument({
                url: url,
                httpHeaders: { Authorization: `Bearer ${getAuthenticationToken()}` },
                withCredentials: true
            }).then(renderPages);
        }
    }
};