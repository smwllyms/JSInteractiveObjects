export default class InteractiveObject {

    constructor(DOMElem, translatable, resizable, DOMparentElem) {
        this.DOMElem = DOMElem;
        this.DOMparentElem = DOMparentElem;

        this.attributes = {};
        // modifiable
        this.attributes.editable = false; // start uneditable
        this.attributes.translatable = translatable;
        this.attributes.resizable = resizable;
        this.attributes.restrictBoundary = DOMparentElem != null;
        this.attributes.lockAspectRatio = true;
        this.attributes.resizeBorderWidth = 4;
        this.onDelete = null;
        // internal
        this.attributes.editing = false;
        this.attributes.translating = false;
        this.attributes.resizing = false;
        this.attributes.resizeDir = 0;
        this.attributes.aspectLocked = false;
        this.attributes.minWidth = 15;
        this.attributes.minHeight = 15;

        // Ensure position is absolute
        this.DOMElem.style.position = "absolute";
        // Also turn off user select
        this.DOMElem.style.userSelect = "none";

        let alias = this;

        // Delete button
        let deleteBtnScale = 2, deleteBtnSiz = 11;
        this.deleteBtn = document.createElement("div");
        this.deleteBtn.style.width = deleteBtnSiz + "px";
        this.deleteBtn.style.height = deleteBtnSiz + "px";
        this.deleteBtn.style.marginLeft = deleteBtnSiz / 2 + "px";
        this.deleteBtn.style.transform = "scale("+deleteBtnScale+")";
        this.deleteBtn.style.backgroundColor = "red";
        this.deleteBtn.style.borderRadius = "5px";
        this.deleteBtn.style.display = "inline-flex";
        this.deleteBtn.style.alignItems = "center";
        this.deleteBtn.style.justifyContent = "center";
        this.bars = [];
        for (var i = 0; i < 2; i++) {
            let aBar = document.createElement("div");
            aBar.style.padding = "0px";
            aBar.style.margin = "0px";
            aBar.style.width = "15%";
            aBar.style.height = "70%";
            aBar.style.backgroundColor = "white";
            aBar.style.position = "absolute";
            aBar.style.transformOrigin = "center center";
            aBar.style.marginLeft = "0.2px";
            this.bars.push(aBar);
        }
        this.bars[0].style.transform = "rotate(45deg)";
        this.bars[1].style.transform = "rotate(135deg)";
        for (var i = 0; i < 2; i++)
            this.deleteBtn.appendChild(this.bars[i]);

        this.deleteBtn.addEventListener("click", ()=>alias.delete());

        this.onMD = function (e) {
            if (!alias.attributes.editable)
                return;

            // Determine if resizing or translating
            if (alias.attributes.resizable) {
                if (!alias.attributes.resizing) {
                    let rect = alias.DOMElem.getBoundingClientRect();
                    
                    let borderL = Math.abs(rect.x-e.x) < alias.attributes.resizeBorderWidth;
                    let borderR = Math.abs(rect.x+rect.width-e.x) < alias.attributes.resizeBorderWidth;
                    let borderT = Math.abs(rect.y-e.y) < alias.attributes.resizeBorderWidth;
                    let borderB = Math.abs(rect.y+rect.height-e.y) < alias.attributes.resizeBorderWidth;
        
                    if (borderL || borderR || borderT || borderB) {
                        alias.attributes.editing = true;
                        alias.attributes.resizing = true; 
                        let dir = 0;

                        if (borderL && borderT)
                            dir = 1;
                        else if (borderR && borderB)
                            dir = 2;
                        else if (borderR && borderT)
                            dir = 3;
                        else if (borderL && borderB)
                            dir = 4;
                        else if (borderL)
                            dir = 5;
                        else if (borderR)
                            dir = 6
                        else if (borderT)
                            dir = 7;
                        else if (borderB)
                            dir = 8;
                        else
                            dir = 0;

                        alias.attributes.resizeDir = dir;

                        return;
                    }
                }
                else return;
            }
            
            if (!alias.attributes.translating && alias.attributes.translatable) {
                alias.attributes.editing = true;
                alias.attributes.translating = true;    
                alias.DOMElem.style.cursor = "move";
            }
        }
        this.onMM = function (e) {
            if (!alias.attributes.editable)
                return;

            let rect;

            if (alias.attributes.resizable && !alias.attributes.translating) {
                rect = alias.DOMElem.getBoundingClientRect();

                let borderL = Math.abs(rect.x-e.x) < alias.attributes.resizeBorderWidth;
                let borderR = Math.abs(rect.x+rect.width-e.x) < alias.attributes.resizeBorderWidth;
                let borderT = Math.abs(rect.y-e.y) < alias.attributes.resizeBorderWidth;
                let borderB = Math.abs(rect.y+rect.height-e.y) < alias.attributes.resizeBorderWidth;
    
                if ((borderL && borderT) || (borderR && borderB))
                    alias.DOMElem.style.cursor = "nwse-resize";
                else if ((borderR && borderT) || (borderL && borderB))
                    alias.DOMElem.style.cursor = "nesw-resize";
                else if (borderL)
                    alias.DOMElem.style.cursor = "ew-resize";
                else if (borderR)
                    alias.DOMElem.style.cursor = "ew-resize";
                else if (borderT)
                    alias.DOMElem.style.cursor = "ns-resize";
                else if (borderB)
                    alias.DOMElem.style.cursor = "ns-resize";
                else
                    alias.DOMElem.style.cursor = "default";
            }

            if (!alias.attributes.editing)
                return;

            if (alias.attributes.translating) {
                let newPos = alias.moveRestricted(e);
                alias.DOMElem.style.left = newPos.x + "px";
                alias.DOMElem.style.top = newPos.y + "px";
            }
            else if (alias.attributes.resizing) {
                let borderL = e.x < rect.x;
                let borderR = e.x > rect.right;                
                let borderT = e.y < rect.y;
                let borderB = e.y > rect.bottom;
                let props = alias.resizeRestricted(e, alias.attributes.resizeDir);
                alias.DOMElem.style.left = props.x + "px";
                alias.DOMElem.style.top = props.y + "px";
                alias.DOMElem.style.width = props.width + "px";
                alias.DOMElem.style.height = props.height + "px";
            }
        }
        this.onMU = function (e) {
            if (!alias.attributes.editable || !alias.attributes.editing)
                return;

            alias.attributes.editing = false;
            if (alias.attributes.translating) {
                alias.attributes.translating = false;
                alias.DOMElem.style.cursor = "default";
            }
            else if (alias.attributes.resizing) {
                alias.attributes.resizing = false;
                alias.attributes.resizeDir = 0;
            }
        }
        this.DOMElem.addEventListener("mousedown", this.onMD, false);
        document.addEventListener("mouseup", this.onMU, false);
        document.addEventListener("mousemove", this.onMM, false);
    }

    delete() {
        // Remove listeners TODO
        this.DOMElem.removeEventListener("mousedown", this.onMD);
        document.removeEventListener("mouseup", this.onMU);
        document.removeEventListener("mousemove", this.onMM);

        this.DOMparentElem.removeChild(this.DOMElem);

        if (this.onDelete != null)
            this.onDelete();
    }

    moveRestricted (idealPos) {

        let myRect = this.DOMElem.getBoundingClientRect();
        let result = {x:(idealPos.x-myRect.width/2),y:(idealPos.y-myRect.height/2)};

        if (!this.attributes.restrictBoundary)
            return result;

        let parentRect = this.DOMparentElem.getBoundingClientRect();

        if (parentRect.x > result.x)
            result.x = parentRect.x;
        else if (parentRect.x + parentRect.width - myRect.width < result.x)
            result.x = parentRect.x + parentRect.width - myRect.width;

        if (parentRect.y > result.y)
            result.y = parentRect.y;
        else if (parentRect.y + parentRect.height - myRect.height < result.y)
            result.y = parentRect.y + parentRect.height - myRect.height;

        return result;
    }

    resizeRestricted (mousePos, dir) {
        let myRect = this.DOMElem.getBoundingClientRect();
        let useBoundary = this.attributes.restrictBoundary;

       
        let parentRect;
        if (useBoundary) 
            parentRect = this.DOMparentElem.getBoundingClientRect();

        let result = {x:myRect.x,y:myRect.y,width:myRect.width,height:myRect.height};

        if ( this.attributes.aspectLocked || this.attributes.lockAspectRatio) {
            // TODO
            if (dir == 1 || dir == 4 || dir == 5) {
                if (!useBoundary || (mousePos.x > parentRect.x && mousePos.x < myRect.left)) {
                    result.x = mousePos.x;
                    result.width += myRect.x - mousePos.x;
                    result.height += myRect.x - mousePos.x;
                }
                else if (mousePos.x > myRect.x) {
                    if (myRect.width > this.attributes.minWidth) {
                        result.x = mousePos.x;
                        result.width -= mousePos.x - myRect.x;
                        result.height -= mousePos.x - myRect.x;
                    }
                    else
                        result.width = this.attributes.minWidth
                }
            }
            return result;
        }

        if (dir == 1 || dir == 4 || dir == 5) {
            if (!useBoundary || mousePos.x > parentRect.x && mousePos.x < myRect.left) {
                result.x = mousePos.x;
                result.width += myRect.x - mousePos.x;
            }
            else if (mousePos.x > myRect.x) {
                if (myRect.width > this.attributes.minWidth) {
                    result.x = mousePos.x;
                    result.width -= mousePos.x - myRect.x;
                }
                else
                    result.width = this.attributes.minWidth
            }
        }
        if (dir == 2 || dir == 3 || dir == 6) {
            if (!useBoundary || mousePos.x < parentRect.right && mousePos.x > myRect.right) {
                // console.log(myRect.width +","+ this.attributes.minWidth)
                result.width += mousePos.x - myRect.right;
            }
            else if (mousePos.x < myRect.right) {
                if (myRect.width > this.attributes.minWidth) {
                    result.width -= myRect.right - mousePos.x;
                }
                else
                result.width = this.attributes.minWidth;
            }
        }

        if (dir == 1 || dir == 3 || dir == 7) {
            if (!useBoundary || mousePos.y > parentRect.top && mousePos.y < myRect.top) {
                result.y = mousePos.y;
                result.height += myRect.y - mousePos.y;
            }
            else if (mousePos.y > myRect.y) {
                if (myRect.height > this.attributes.minHeight) {
                    result.y = mousePos.y;
                    result.height -= mousePos.y - myRect.y;
                }
                else
                    result.height = this.attributes.minHeight;
            }
        }
        if (dir == 2 || dir == 4 || dir == 8) {
            if (!useBoundary || mousePos.y < parentRect.bottom && mousePos.y > myRect.bottom) {
                result.height += mousePos.y - myRect.bottom;
            }
            else if (mousePos.y < myRect.bottom) {
                if (myRect.height > this.attributes.minHeight) {
                    result.height -= myRect.bottom - mousePos.y;
                }
                else
                    result.height = this.attributes.minHeight;
            }
        }

        return result;
    }

    toggleEdit() {
        if (!this.attributes.editable) {
            this.DOMElem.appendChild(this.deleteBtn);
        }
        else {
            this.DOMElem.removeChild(this.deleteBtn);
        }
        this.attributes.editable = !this.attributes.editable;
    }
}